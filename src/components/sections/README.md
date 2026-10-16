# Ready React sections

Import from @/components/sections/layouts. Supply verified business content through props and children. Set project theme variables and composition; these are structural defaults.

| Export | Variants or slots |
| --- | --- |
| Hero | split, photo, editorial; navigation, media, inquiry, footer, children |
| Section / SectionHeading | section wrapper; eyebrow, title, intro |
| CardGrid / PhotoCard | cards, bento, rows; image, title, href, icon, children |
| SplitSection | reverse, inset; media and children |
| CallToAction | children and action |
| FooterLayout | columns, compact; children and bottom |
| FAQ | question/answer items; shadcn keyboard behavior |
| FeedbackCarousel | verified name/content items; touch, keyboard, visible controls |
| InquiryDialogForm | existing InquiryConfig, labeled fields as children, submitLabel; draft dialog and focus restoration |

Preview during development at /?layouts=1 (add &variant=photo or &variant=editorial). Previews are excluded from production. The 27 legacy HTML/CSS references remain optional ideas; no mass conversion is needed.

TestimonialCards is the default review section: verified name/quote items with optional detail, real avatar, or sourceHref. It uses shadcn Card/CardContent and responsive equal-height cards with bottom-aligned attribution. Use FeedbackCarousel only for an approved carousel composition; see AGENTS.md for the testimonial UI standard.
