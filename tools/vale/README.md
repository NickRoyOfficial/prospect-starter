<!-- vale off -->
# StopSlop for Vale

The copy rules in docs/copy-rules.md as a Vale package, for linting markdown drafts, briefs and copy decks before they reach the page. The page itself is linted by `npm run audit` (scripts/audit/copy.mjs), which ports the same rules to JavaScript.

`brew install vale`, then:

```
./lint.sh <file-or-dir>          # everything: errors, warnings, suggestions
./lint.sh <file-or-dir> --gate   # errors only, non-zero exit. Use before shipping.
```

Lints markdown, plain text and HTML. Reports real line numbers.

## Rules

| Level | Rule | Catches |
|---|---|---|
| error | BannedPhrases | throat-clearing openers, emphasis crutches, business jargon |
| error | NegationPivot | "not X, it's Y" in full-stop and comma forms, "not because, because", "stops being / starts being" |
| error | VagueDeclaratives | "the implications are significant", "this changes everything" |
| error | MetaCommentary | text that announces its own structure |
| error | EmDash | any em dash |
| error | ClosingRituals | "in conclusion", "the possibilities are endless", "watch this space" |
| warning | AIVocabulary | delve, intricate, tapestry, pivotal, showcase, seamless, curated, leverage, myriad |
| warning | Adverbs | the kill-list from phrases.md |
| warning | AdverbDensity | more than one -ly adverb in a paragraph |
| warning | FalseAgency | inanimate subjects doing human verbs |
| warning | ParticiplePhrase | ", highlighting their significance." |
| warning | RepeatedOpeners | three sentences in a row opening with the same word |
| warning | Monotony | sentence-length coefficient of variation below 0.35 |
| suggestion | WeaselWords | several, various, relatively, arguably |
| suggestion | LazyExtremes | every, always, never, nobody |
| suggestion | WhOpener | sentences opening What/When/Why/How |
| suggestion | RuleOfThree | three-item lists |
| suggestion | Passive | be-verb plus participle |
| suggestion | Readability | grade level above 12 |
| suggestion | FormattingTells | emoji as formatting, "Firstly, Secondly" |

## Calibration

| Corpus | Result |
|---|---|
| Slop sample, seven banned patterns | 4 errors, 15 warnings, 2 suggestions. All patterns caught. |
| Orwell, *Politics and the English Language* | 0 errors |
| This skill's own files | 0 errors |

Ship on zero errors. Warnings and suggestions need judgement: a passive construction in a citation
is fine, a "nobody" that is literally true is fine.

## Exemptions

Verbatim source quotes are evidence, not our prose. Wrap them in `<!-- vale off -->` and
`<!-- vale on -->`, or use `> ` blockquotes in markdown, or `<div class="quote">` in HTML.
Text in backticks, in double quotes, in bold, in tables and in fenced code blocks is treated as a
citation and skipped, which is how a catalog can list the phrases it bans.

## Two footguns in Vale itself

1. `.vale.ini` splits option values on commas, so a `{n,m}` regex quantifier in `BlockIgnores` or
   `TokenIgnores` breaks the config with a confusing error. Use `+` or `*`.
2. A rule's `raw:` list entries are joined with no separator, so a list of alternatives silently
   becomes one impossible pattern. Put the whole alternation in a single entry.
