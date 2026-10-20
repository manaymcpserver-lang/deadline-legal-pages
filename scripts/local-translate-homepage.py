#!/usr/bin/env python3
"""Free, offline draft translation. No web translation API is called.

Install ctranslate2, sentencepiece, opencc-python-reimplemented in a separate
environment. Download the MIT M2M100 int8 files once, then all inference is local.
Generated dictionaries require semantic/layout review before publication.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import time

ROOT = Path(__file__).resolve().parent.parent
MODEL_REVISION = '7c1b2620a4e58dacecbd8bf89cfd6da7eb9eb7b0'
BRANDS = ['Nonlate Data Deletion Request', 'Google API Services User Data Policy', 'Limited Use', 'Google Classroom', 'Google Calendar', 'Google Tasks', 'Google OAuth', 'RevenueCat', 'App Attest', 'DeviceCheck', 'Google Play Integrity', 'EncryptedSharedPreferences', 'Android Keystore', 'Apple Keychain', 'AES-256-GCM', 'AES-256', 'HTTPS/TLS', 'OAuth', 'Notion', 'Microsoft', 'Jira', 'Nonlate', 'iPhone', 'iOS', 'Android', 'App Store', 'Google Play', 'Focus Lock',
          'Plus', 'Pro', 'Screen Time', 'Live Sync', 'Focus Pulse', 'Daily Wisdom',
          'Facebook', 'Instagram', 'Reddit', 'Snapchat', 'TikTok', 'Trello', 'YouTube',
          'Keychain', 'Keystore', 'HTTPS/TLS', 'USD', 'Google', 'Apple', 'X', 'Free',
          'Aurora', 'Bloom', 'Boring', 'Sage']
PROTECTED = re.compile(r'\{[^{}]+\}|https?://\S+|[\w.+-]+@[\w.-]+|nonlate\.app|\$\d+(?:\.\d+)?|\b\d+(?:\.\d+)?[dh]\b|\b\d+(?:\.\d+)?\b|' + '|'.join(r'(?<!\w)' + re.escape(x) + r'(?!\w)' for x in sorted(BRANDS, key=len, reverse=True)))
SOURCE_LANGUAGE = {'fil': 'tl', 'nb': 'no', 'zh-Hans': 'zh', 'zh-Hant': 'zh', 'pt-BR': 'pt', 'pt-PT': 'pt'}


def digest(strings):
    return hashlib.sha256(json.dumps(strings, ensure_ascii=False).encode()).hexdigest()


def protected_signature(text, original):
    expected = Counter(PROTECTED.findall(original))
    # Plus/Free/Pro can also be ordinary words in target languages (French
    # "Plus de..." means "More..."). Only count brands as data when the source
    # contains that brand; always count numeric values/placeholders/URLs.
    found = Counter(token for token in PROTECTED.findall(text) if token not in BRANDS or token in expected)
    for token in {'Plus', 'Free', 'Pro'}:
        if found[token] > expected[token]:
            found[token] = expected[token]
    return +found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', default='/Users/manay/Developer/nonlate-translation-model')
    parser.add_argument('--locales', nargs='*')
    parser.add_argument('--directory', default='homepage', choices=['homepage', 'guides','legal'])
    parser.add_argument('--replace-incomplete', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--intra-threads', type=int, default=4)
    parser.add_argument('--inter-threads', type=int, default=1)
    parser.add_argument('--batch-size', type=int, default=8)
    args = parser.parse_args()
    import ctranslate2
    import sentencepiece
    from opencc import OpenCC
    data = ROOT / 'translations' / args.directory
    source = json.loads((data / 'source.json').read_text())
    strings = source['strings']
    source_hash = source.get('sourceHash') or digest(strings)
    locales = args.locales or json.loads((ROOT / 'app/guides/locales.json').read_text())
    model = ctranslate2.Translator(args.model, device='cpu', compute_type='int8', intra_threads=args.intra_threads, inter_threads=args.inter_threads, max_queued_batches=-1)
    tokenizer = sentencepiece.SentencePieceProcessor(model_file=str(Path(args.model) / 'sentencepiece.bpe.model'))
    traditional = OpenCC('s2t')
    simplified = OpenCC('t2s')
    cache = {}
    catalog_file = Path('/Users/manay/Desktop/DeadLine/DeadLine-iOS/DeadLine/Resources/Localizable.xcstrings')
    catalog = json.loads(catalog_file.read_text()).get('strings', {}) if catalog_file.exists() else {}

    def run_batch(texts, language):
        cache_file = Path(args.model) / ('draft-cache-' + language + '.json')
        if cache_file.exists():
            for original, output in json.loads(cache_file.read_text()).items():
                cache.setdefault((language, original), output)
        missing = list(dict.fromkeys(s for s in texts if (language, s) not in cache))
        jobs = []
        for start in range(0, len(missing), args.batch_size):
            chunk = missing[start:start+args.batch_size]
            tokens = [['__en__'] + tokenizer.encode(s, out_type=str) + ['</s>'] for s in chunk]
            results = model.translate_batch(tokens, target_prefix=[['__' + language + '__']] * len(tokens),
                beam_size=3, max_decoding_length=512, repetition_penalty=1.1, no_repeat_ngram_size=5, asynchronous=True)
            jobs.append((start, chunk, results))
        for start, chunk, results in jobs:
            results = [result.result() for result in results]
            for original, result in zip(chunk, results):
                output = tokenizer.decode([t for t in result.hypotheses[0] if not t.startswith('__')])
                # The model may change case in familiar names. Restore the exact brand spelling.
                for brand in sorted(BRANDS, key=len, reverse=True):
                    if brand not in {'Plus','Free','Pro','X'} and re.search(r'(?<!\w)' + re.escape(brand) + r'(?!\w)', original):
                        output = re.sub(r'(?<!\w)' + re.escape(brand) + r'(?!\w)', brand, output, flags=re.I)
                cache[language, original] = output
            cache_file.write_text(json.dumps({s: v for (lang, s), v in cache.items() if lang == language}, ensure_ascii=False))
            if len(missing) > args.batch_size:
                print(f'  {language}: {min(start+args.batch_size,len(missing))}/{len(missing)} generated', flush=True)
        return [cache[language, s] for s in texts]

    for code in locales:
        if code == 'en':
            continue
        started = time.time()
        destination = data / (code + '.json')
        old = json.loads(destination.read_text()) if destination.exists() else {}
        if not args.force and old.get('sourceHash') == source_hash and set(old.get('strings', {})) == set(strings):
            print(code, 'already complete', flush=True)
            continue
        language = SOURCE_LANGUAGE.get(code, code)
        values = {s:v for s,v in old.get('strings', {}).items() if s in strings and protected_signature(v,s) == Counter(PROTECTED.findall(s))} if args.replace_incomplete else {}
        if args.directory=='legal':
            for category in ['homepage','guides']:
                reuse=ROOT/'translations'/category/(code+'.json')
                previous=json.loads(reuse.read_text()).get('strings',{})
                values.update({s:previous[s] for s in strings if s in previous and protected_signature(previous[s],s)==Counter(PROTECTED.findall(s))})
        # Reuse already translated identical guide phrases (no network requests).
        guide_path = ROOT / 'translations/guides' / (code + '.json')
        if args.directory == 'homepage' and guide_path.exists():
            previous = json.loads(guide_path.read_text()).get('strings', {})
            values.update({s: previous[s] for s in strings if s in previous and protected_signature(previous[s],s) == Counter(PROTECTED.findall(s))})
        for original in strings:
            translated = catalog.get(original, {}).get('localizations', {}).get(code, {}).get('stringUnit', {}).get('value')
            if translated and protected_signature(translated,original) == Counter(PROTECTED.findall(original)):
                values[original] = translated
            if PROTECTED.fullmatch(original) or original in {'en', 'screenshot-language-note', 'button', 'is-highlighted', 'lazy', 'plan-annual-price', 'plan-badge', 'plan-status', 'screen-meta', 'status', 'true'}:
                values[original] = original
        manual_file = data / 'manual' / (code + '.json')
        if manual_file.exists():
            manual = json.loads(manual_file.read_text())
            if 'byIndex' in manual:
                manual = {strings[int(index)]: value for index, value in manual['byIndex'].items()}
            else:
                manual = manual.get('strings', manual)
            values.update({s: manual[s] for s in strings if s in manual})
        pending = [s for s in strings if s not in values]
        outputs = run_batch(pending, language)
        repairs = []
        unresolved = []
        for original, output in zip(pending, outputs):
            expected = Counter(PROTECTED.findall(original))
            if not output.strip() or protected_signature(output,original) != expected:
                # Translate prose segments around protected data without risking names,
                # prices, counts, placeholders or links. This is deliberately conservative.
                spans = list(PROTECTED.finditer(original))
                pieces, cursor = [], 0
                for span in spans:
                    pieces.append((False, original[cursor:span.start()]))
                    pieces.append((True, span.group()))
                    cursor = span.end()
                pieces.append((False, original[cursor:]))
                prose = [text.strip() for locked, text in pieces if not locked and re.search(r'[A-Za-z]', text)]
                translated = iter(run_batch(prose, language))
                assembled = []
                for locked, text in pieces:
                    if locked or not re.search(r'[A-Za-z]', text):
                        assembled.append(text)
                    else:
                        leading = ' ' if text[:1].isspace() else ''
                        trailing = ' ' if text[-1:].isspace() else ''
                        assembled.append(leading + next(translated) + trailing)
                output = ''
                for piece in assembled:
                    if output and piece and output[-1].isalnum() and piece[0].isalnum():
                        output += ' '
                    output += piece
                repairs.append(original)
            if code == 'zh-Hant':
                output = traditional.convert(output)
            elif code == 'zh-Hans':
                output = simplified.convert(output)
            if protected_signature(output,original) != expected:
                unresolved.append({'source': original, 'draft': output, 'issue': 'Protected data check failed; original retained pending manual translation.'})
                output = original
            values[original] = output
        result = {'locale': code, 'sourceHash': source_hash, 'revision': 1,
            'method': 'offline M2M100-418M int8 draft; terminology and structure checked; semantic/native-language review required',
            'model': 'jncraton/m2m100_418M-ct2-int8', 'modelRevision': MODEL_REVISION,
            'reviewStatus': 'draft-machine-assisted',
            'unresolvedUnits': unresolved,
            'protectedSegmentFallbacks': repairs,
            'strings': {s: values[s] for s in strings}}
        destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        print(f'{code}: {len(strings)} units; {len(repairs)} protected repairs; {time.time()-started:.1f}s', flush=True)


if __name__ == '__main__':
    main()
