"""Text preprocessing pipeline used by pipeline_finale.joblib."""

import re

import nltk
from sklearn.base import BaseEstimator, TransformerMixin

try:
    import ftfy
except ImportError:
    ftfy = None

try:
    import emoji
except ImportError:
    emoji = None

try:
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

    base_stop_words = set(ENGLISH_STOP_WORDS)
except Exception:
    base_stop_words = set()

nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

negation_words = {
    "no", "not", "nor", "never", "none", "nothing", "nowhere", "neither",
    "cannot", "can't", "dont", "don't", "didnt", "didn't", "doesnt", "doesn't",
    "isnt", "isn't", "wasnt", "wasn't", "werent", "weren't", "wont", "won't",
    "wouldnt", "wouldn't", "shouldnt", "shouldn't", "couldnt", "couldn't",
}
safe_stop_words = base_stop_words - negation_words

slang_dict = {
    "u": "you", "ur": "your", "ya": "you", "idk": "i do not know",
    "imo": "in my opinion", "imho": "in my humble opinion",
    "btw": "by the way", "brb": "be right back",
    "lol": "laughing", "lmao": "laughing", "omg": "oh my god",
    "tf": "the fuck", "wtf": "what the fuck", "rn": "right now",
    "tho": "though", "thx": "thanks", "pls": "please", "plz": "please",
    "bc": "because", "bcz": "because", "cuz": "because",
    "gonna": "going to", "wanna": "want to", "gotta": "got to",
    "kinda": "kind of", "sorta": "sort of",
}

contraction_dict = {
    "i'm": "i am", "i've": "i have", "i'll": "i will", "i'd": "i would",
    "you're": "you are", "you've": "you have", "he's": "he is",
    "she's": "she is", "it's": "it is", "we're": "we are",
    "they're": "they are", "can't": "cannot", "won't": "will not",
    "don't": "do not", "didn't": "did not", "doesn't": "does not",
    "isn't": "is not", "aren't": "are not", "wasn't": "was not",
    "weren't": "were not", "shouldn't": "should not",
    "wouldn't": "would not", "couldn't": "could not",
}

url_pattern = re.compile(r"https?://\S+|www\.\S+")
mention_pattern = re.compile(r"@\w+")
hashtag_pattern = re.compile(r"#(\w+)")
html_pattern = re.compile(r"<.*?>")


def fix_unicode_text(text):
    return ftfy.fix_text(text) if ftfy is not None else text


def convert_emojis(text):
    if emoji is not None:
        text = emoji.demojize(text, delimiters=(" ", " "))
        text = text.replace(":", " ").replace("_", " ")
    return text


def expand_contractions(text):
    return " ".join(contraction_dict.get(word, word) for word in text.split())


def normalize_slang_text(text):
    return " ".join(slang_dict.get(word, word) for word in text.split())


def reduce_elongated_words(text):
    return re.sub(r"(\w)\1{2,}", r"\1\1", text)


def reduce_repeated_punctuation(text):
    text = re.sub(r"!{2,}", "!", text)
    text = re.sub(r"\?{2,}", "?", text)
    text = re.sub(r"\.{3,}", "...", text)
    return text


def remove_special_characters(text):
    return re.sub(r"[^a-zA-Z0-9\s'!?]", " ", text)


def remove_stopwords_safe(text):
    return " ".join(word for word in text.split() if word not in safe_stop_words)


def lemmatize_text(text):
    return " ".join(lemmatizer.lemmatize(word) for word in text.split())


def basic_token_cleanup(text):
    return re.sub(r"\s+", " ", text).strip()


class TextCleaner(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return [self.clean_data(text) for text in X]

    @staticmethod
    def clean_data(text):
        text = str(text)
        text = fix_unicode_text(text)
        text = convert_emojis(text)
        text = html_pattern.sub(" ", text)
        text = url_pattern.sub(" <url> ", text)
        text = mention_pattern.sub(" <name> ", text)
        text = hashtag_pattern.sub(r" \1 ", text)
        text = text.lower()
        text = expand_contractions(text)
        text = normalize_slang_text(text)
        text = re.sub(r"\d+", " <number> ", text)
        text = reduce_elongated_words(text)
        text = reduce_repeated_punctuation(text)
        text = remove_special_characters(text)
        text = remove_stopwords_safe(text)
        text = lemmatize_text(text)
        text = basic_token_cleanup(text)
        return text
