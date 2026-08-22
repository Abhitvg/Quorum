import re

def test_wake_word_regex():
    wake_word_pattern = re.compile(r'\bquo\b', re.IGNORECASE)
    
    # Positive tests
    assert wake_word_pattern.search("Hey Quo, can you help me?") is not None
    assert wake_word_pattern.search("quo") is not None
    assert wake_word_pattern.search("quo.") is not None
    assert wake_word_pattern.search("QUO!") is not None
    
    # Negative tests (false positives we want to avoid)
    assert wake_word_pattern.search("can you quote that") is None
    assert wake_word_pattern.search("quota") is None
    assert wake_word_pattern.search("status quo") is not None # Wait, "status quo" should trigger it? Actually yes, it's a separate word.
    assert wake_word_pattern.search("liquor") is None
if __name__ == '__main__':
    test_wake_word_regex()
    print('Success!')
