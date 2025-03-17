import re
import unicodedata

def clean_text_(text):
    # text = text.replace("\n", " ")  # Replace newlines with spaces
    text = re.sub(r'\s+', ' ', str(text))  # Remove extra spaces
    return text.strip()  # Trim leading and trailing spaces

def remove_special_chars(text):
    text = re.sub(r'[^a-zA-Z0-9.,!?\'" ]', '', text)  # Keep letters, numbers, and common punctuation
    return text

def fix_hyphenation(text):
    return re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)  # Removes hyphenation across lines

def normalize_unicode(text):
    return unicodedata.normalize("NFKD", text)

def remove_headers_footers(text):
    lines = text.split("\n")
    cleaned_lines = [line for line in lines if not re.match(r'(Page \d+|Confidential|Company Name)', line)]
    return " ".join(cleaned_lines)

def normalize_text(text):
    return " ".join(text.lower().split())

def full_text_cleanup(text):
    """"
    Takes in unclean text and return cleaned text by applying a series of cleaning functions.
    
    """
    text = clean_text_(text)
    text = fix_hyphenation(text)
    text = remove_special_chars(text)
    text = normalize_unicode(text)
    text = remove_headers_footers(text)
    text = normalize_text(text)
    
    return text

