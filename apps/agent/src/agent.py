import os
from dotenv import load_dotenv
load_dotenv()
import aiohttp
import asyncio
import logging
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.plugins.deepgram import STT
from livekit.plugins.elevenlabs import TTS
from livekit import rtc
from llm.llm_provider import OpenAIProvider

logger = logging.getLogger("quorum-agent")

INTERNAL_API_URL = os.getenv("INTERNAL_API_URL", "http://localhost:3001/internal")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Initialize persistent audio track for the agent's voice
    source = rtc.AudioSource(24000, 1)
    track = rtc.LocalAudioTrack.create_audio_track("agent-mic", source)
    options = rtc.TrackPublishOptions()
    options.source = rtc.TrackSource.SOURCE_MICROPHONE
    await ctx.room.local_participant.publish_track(track, options)
    
    # Provider for TTS and LLM
    llm_provider = OpenAIProvider(model="openai/gpt-4o-mini")
    tts = TTS()
    
    # Reusable HTTP session for internal API calls
    http_session = aiohttp.ClientSession()
    ctx.add_cleanup_callback(http_session.close)
    
    # A lock to prevent multiple concurrent responses
    is_responding = False

    async def update_state(state: str):
        # Update local participant attributes so the UI (AgentTile) transitions
        # state is one of: 'idle', 'researching', 'responding'
        if ctx.room.local_participant:
            logger.info(f"Setting agent state to: {state}")
            await ctx.room.local_participant.set_attributes({"agentState": state})

    await update_state("idle")

    async def handle_agent_turn(query_text: str):
        nonlocal is_responding
        try:
            await update_state("researching")
            
            # Call LLM
            response_text = await llm_provider.generate_response(query_text)
            
            await update_state("responding")
            
            # Post agent's response to the transcript panel
            await post_transcript({
                "roomName": ctx.room.name,
                "speakerIdentity": os.getenv("AGENT_IDENTITY", "quo-agent"),
                "speakerName": "Quo",
                "text": response_text,
                "isFinal": True
            })
            
            # Synthesize speech
            # We use TTS.synthesize which returns an async iterable of audio frames
            audio_stream = tts.synthesize(text=response_text)
            
            # Push frames to the persistent source
            async for frame_event in audio_stream:
                await source.capture_frame(frame_event.frame)
                
        except Exception as e:
            logger.error(f"Error during agent turn: {e}")
        finally:
            await update_state("idle")
            is_responding = False

    async def post_transcript(data):
        if not INTERNAL_API_KEY:
            logger.error("INTERNAL_API_KEY missing")
            return
            
        try:
            headers = {"Authorization": f"Bearer {INTERNAL_API_KEY}"}
            # roomName is already in data
            
            async with http_session.post(f"{INTERNAL_API_URL}/transcripts", json=data, headers=headers) as resp:
                if resp.status != 200:
                    logger.error(f"Failed to post transcript: {resp.status}")
        except Exception as e:
            logger.error(f"Error posting transcript: {e}")

    # Listen to audio tracks
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        if track.kind == "audio":
            logger.info(f"Subscribed to audio from {participant.identity}")
            
            # Create a dedicated STT stream for this participant to attribute transcripts correctly
            participant_stt = STT(model="nova-3-general")
            participant_stt_stream = participant_stt.stream()
            
            async def process_participant_stt():
                nonlocal is_responding
                async for event in participant_stt_stream:
                    if event.type == "speech_final" or event.type == "interim_transcript":
                        is_final = event.type == "speech_final"
                        text = event.alternatives[0].text
                        
                        if text.strip():
                            # 1. ALWAYS persist unconditionally to the DB so the transcript panel is complete
                            await post_transcript({
                                "roomName": ctx.room.name,
                                "speakerIdentity": participant.identity,
                                "speakerName": participant.name or participant.identity,
                                "text": text,
                                "isFinal": is_final
                            })

                            # 2. Branch: check for wake word
                            if is_final and not is_responding:
                                import re
                                # Use word boundaries so "quote" doesn't trigger "quo"
                                if re.search(r'\bquo\b', text, re.IGNORECASE):
                                    # Start processing
                                    is_responding = True
                                    asyncio.create_task(handle_agent_turn(text))
            
            async def push_frames():
                async for frame in track:
                    participant_stt_stream.push_frame(frame)
            
            asyncio.create_task(process_participant_stt())
            asyncio.create_task(push_frames())

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name=os.getenv("AGENT_IDENTITY", "quo-agent")))
