/**
 * Clearly labeled SAMPLE articles that demonstrate the templates and CMS.
 * They are seeded as noindex, excluded from sitemaps, flagged isSample and
 * left "Not reviewed" — an editor must review or replace them before launch.
 * Image tokens @@key@@ are replaced with demo media ids by the seed script.
 * No statistics, quotes, product claims or personal testing are invented.
 */

export interface SeedArticle {
  slug: string;
  category: string; // "root/child"
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  contentType: "INSPIRATION_GALLERY" | "HOW_TO" | "EXPLAINER" | "TREND_ANALYSIS" | "OUTFIT_GUIDE" | "COMPARISON" | "SHOPPING_ROUNDUP" | "FEATURE";
  image: string;
  tags: string[];
  featured?: boolean;
  toc?: boolean;
  body: string;
}

export const SAMPLE_ARTICLES: SeedArticle[] = [
  {
    slug: "short-almond-nail-designs",
    category: "nails/almond-nails",
    title: "Short Almond Nails: A Practical Guide to the Most Flattering Shape",
    subtitle: "Why the tapered, rounded shape works on shorter lengths — and how to ask for it.",
    seoTitle: "Short Almond Nails: Shape Guide & Design Ideas",
    metaDescription: "How short almond nails differ from oval and stiletto, how to file the shape at home, and neutral, French and chrome design ideas that suit shorter lengths.",
    contentType: "HOW_TO",
    image: "almond-neutral",
    tags: ["almond nails", "short nails", "nail shapes"],
    featured: true,
    toc: true,
    body: `Almond nails are often pictured long and dramatic, but the shape adapts well to shorter lengths. Slim sides that taper to a softly rounded tip draw the eye upward, which is why the shape is frequently suggested for making fingers look longer.

## What makes a nail "almond"

An almond nail has straight or gently curved sides that narrow toward a rounded peak — think of the nut itself. It sits between two familiar shapes:

- **Oval** keeps the sides parallel and rounds the whole tip evenly.
- **Almond** narrows the sides before rounding, so the tip is slimmer.
- **Stiletto** narrows all the way to a point.

On short nails, the difference between oval and almond is subtle. The narrowing usually starts just past the fingertip, so you need only a little free edge to create the shape.

## How to file a short almond shape

1. Start with clean, dry nails and a fine-grit file.
2. File the sides at a slight angle toward the center, working in one direction rather than sawing back and forth.
3. Check both sides from above so they mirror each other.
4. Round the peak with small, light strokes.
5. Smooth the edge by holding the file under the nail at an angle.

:::tip Keep the side walls
Filing too deep into the sides weakens the nail. Leave a little width at the base of the free edge so the shape is supported.
:::

## Design ideas that suit shorter lengths

Table: Short almond design ideas at a glance
| Look | Why it works | Upkeep |
| Sheer neutral | Elongates and hides regrowth | Low |
| Micro French tip | Echoes the curve of the tip | Medium |
| Soft chrome | Catches light on a small surface | Medium |
| Deep, glossy color | Makes a short shape look deliberate | Medium |

For a micro French tip, keep the line thin — a heavy tip can make a short nail look shorter. You'll find more variations in our [French manicure ideas](/nails/french-manicure-ideas/).

![Soft chrome reads as polished rather than flashy on a short length.](media:@@almond-chrome@@)

## Is almond right for you?

The shape is versatile, but it relies on a little free edge. If you type all day or prefer nails trimmed right to the fingertip, a [short squoval or rounded shape](/nails/short-nail-ideas/) may be more comfortable.

:::faq Questions, answered
Q: Can I get almond nails on very short natural nails?
A: You need a small free edge to taper. If your nails are trimmed to the fingertip, grow them for a week or two first, or ask about a soft rounded shape instead.
Q: Do almond nails break more easily?
A: Over-filing the sides can weaken any shape. Keeping some width at the base of the free edge helps.
:::`,
  },
  {
    slug: "french-manicure-ideas",
    category: "nails/french-manicure",
    title: "French Manicure Ideas, From Classic Tips to Color",
    subtitle: "The enduring white tip and the updates that keep it interesting.",
    seoTitle: "French Manicure Ideas: Classic, Micro & Color Tips",
    metaDescription: "French manicure ideas from the classic white tip to micro and colored tips, plus what to ask for at the salon and how to keep the line crisp at home.",
    contentType: "INSPIRATION_GALLERY",
    image: "french-classic",
    tags: ["french manicure", "nail designs"],
    featured: true,
    body: `A French manicure pairs a sheer, natural-looking base with a contrasting tip. Its appeal is that it looks finished without looking like you tried hard — and small changes to the tip make it feel new.

## The classic

The traditional version uses a sheer pink or nude base and an opaque white tip that follows the natural "smile line" of the nail. The base should be sheer enough to look like a healthy nail, not a solid color.

## Updates worth trying

- **Micro French:** a very thin tip line that looks especially clean on [short almond nails](/nails/short-almond-nail-designs/).
- **Color tips:** swap white for a single color. Deep rose, navy and chocolate brown feel quietly polished.
- **Double line:** a second thin line just below the tip adds detail without bulk.
- **Mismatched tips:** a different shade on each finger in one color family.

![A deep rose micro tip keeps the look tonal.](media:@@french-color@@)

## What to ask for at the salon

Bring a photo and specify three things: the base (sheer pink, milky white or nude), the tip thickness, and the shape. A thinner tip generally suits shorter nails.

:::note Doing it at home
Tip guides and a fine liner brush make the curve easier. Clean up the edge with a small brush dipped in remover before your top coat.
:::

> The French manicure endures because it reads as care rather than decoration.

For seasonal color ideas you could use on the tips, see our guide to [fall nail colors](/nails/fall-nail-colors/).`,
  },
  {
    slug: "short-nail-ideas",
    category: "nails/short-nails",
    title: "Short Nail Ideas That Look Polished With Minimal Upkeep",
    subtitle: "Shapes, colors and finishes chosen for real life.",
    seoTitle: "Short Nail Ideas: Shapes, Colors & Low-Maintenance Looks",
    metaDescription: "Short nail ideas that stay polished: the best shapes for short nails, colors that make them look intentional, and how to keep chips from showing.",
    contentType: "INSPIRATION_GALLERY",
    image: "short-nails",
    tags: ["short nails", "nail colors"],
    body: `Short nails are practical, and they can look every bit as considered as longer ones. The key is choosing a shape and finish that make the length look deliberate.

![](media:@@short-nails@@)

## Shapes that suit short nails

- **Squoval:** a square shape with softened corners. Strong and easy to maintain.
- **Round:** follows the fingertip and resists snagging.
- **Soft almond:** a gentle taper that lengthens the look — see our [short almond guide](/nails/short-almond-nail-designs/).

## Colors that make short nails look intentional

Deep, glossy shades — burgundy, espresso, navy — look striking on short nails because the color reads as a choice rather than a compromise. Sheer neutrals do the opposite: they blur the edge of the nail so length matters less.

:::tip Hide chips
On short nails, wrap the color slightly over the free edge and seal it with top coat. Re-apply a thin layer of top coat every few days.
:::

## Low-maintenance finishes

1. **Sheer milky white** shows regrowth less than solid color.
2. **One-shade glossy** is easy to touch up.
3. **Negative-space dots** leave room to grow out gracefully.

For keeping your manicure intact longer, read [how to make a manicure last](/nails/make-manicure-last-longer/).`,
  },
  {
    slug: "fall-nail-colors",
    category: "nails/nail-colors",
    title: "Fall Nail Colors: How to Choose Shades That Suit You",
    subtitle: "A simple way to pick autumn shades by undertone rather than trend.",
    seoTitle: "Fall Nail Colors: Choosing Shades for Your Skin Tone",
    metaDescription: "How to choose fall nail colors by undertone, with a guide to chocolate, olive, burgundy, taupe, navy and copper shades and how to wear each.",
    contentType: "EXPLAINER",
    image: "nail-palette",
    tags: ["nail colors", "fall", "seasonal nails"],
    body: `Autumn palettes lean deeper and warmer, but there's no single right shade. A more useful starting point than any trend is your skin's undertone.

![](media:@@nail-palette@@ wide)

## Find your undertone

Look at the inside of your wrist in daylight. Veins that look more green suggest warm undertones; more blue or purple suggests cool; a mix suggests neutral. It's a rough guide, not a rule — the best test is swatching a shade on one nail.

## A shade-by-shade guide

Table: Fall shades and how to wear them
| Shade | Often flatters | Wear it with |
| Chocolate brown | Warm and neutral undertones | Camel, cream, denim |
| Olive green | Warm undertones | Gold jewelry, rust |
| Burgundy | Most undertones | Black, grey, navy |
| Taupe | Cool and neutral undertones | Soft neutrals |
| Navy | Cool undertones | Silver, crisp white |
| Copper shimmer | Warm undertones | Brown leather, knitwear |

## Finishes for the season

A high-gloss top coat makes deep shades look richer. Matte finishes suit muted colors like taupe and olive but show wear faster, so plan to refresh them.

:::info A note on trends
Seasonal "it" shades come and go. If a color makes you reach for your manicure more often, that matters more than whether it's in fashion.
:::

Pair a deep color with a [French tip](/nails/french-manicure-ideas/) for a subtler version.`,
  },
  {
    slug: "make-manicure-last-longer",
    category: "nails/nail-care",
    title: "How to Make a Manicure Last Longer",
    subtitle: "Prep, application and aftercare habits that help polish stay put.",
    seoTitle: "How to Make a Manicure Last Longer: Prep to Aftercare",
    metaDescription: "Practical steps to make a manicure last longer: nail prep, thin coats, capping the free edge, top coat refreshes and everyday habits that prevent chips.",
    contentType: "HOW_TO",
    image: "french-classic",
    tags: ["nail care", "manicure"],
    body: `Most chips start with prep. Oils and moisture on the nail surface keep polish from adhering, and thick coats dry unevenly. A few habits make a noticeable difference.

## Before you paint

1. Remove old polish fully and wash your hands.
2. Push back cuticles gently after a shower, when they're soft. Avoid cutting live tissue.
3. Wipe each nail with a little remover or alcohol to remove oils.

## Application

- Use **thin coats**. Two thin color coats dry more evenly than one thick one.
- **Cap the free edge:** run the brush lightly along the tip of the nail to seal it.
- Let each layer set for a couple of minutes before the next.

:::tip Refresh the top coat
A thin layer of top coat every two or three days restores shine and adds protection at the tips.
:::

## Everyday habits

Wear gloves for washing dishes and cleaning, and avoid using nails as tools to open cans or peel labels. Keep hands moisturized, focusing on the cuticles, but wash any lotion off the nail surface before painting.

## When to see a professional

If nails are persistently brittle, discolored or painful, speak with a doctor or board-certified dermatologist rather than covering it with polish.

Looking for colors to try next? Browse our [short nail ideas](/nails/short-nail-ideas/).`,
  },
  {
    slug: "work-outfit-ideas",
    category: "outfits/work-outfits",
    title: "Work Outfits: How to Build a Week of Office Looks",
    subtitle: "A small set of pieces, combined five ways.",
    seoTitle: "Work Outfit Ideas: A Week of Office Looks From Few Pieces",
    metaDescription: "How to build a week of work outfits from a few versatile pieces: a blazer, tailored trousers, knitwear and simple tops, with formulas for every dress code.",
    contentType: "OUTFIT_GUIDE",
    image: "workwear",
    tags: ["work outfits", "capsule wardrobe", "blazers"],
    featured: true,
    toc: true,
    body: `Dressing for work is easier when you rely on formulas rather than inspiration at 7 a.m. Start with a few dependable pieces in colors that all work together, then rotate them.

![](media:@@workwear@@)

## The core pieces

- A blazer in navy, black or grey
- Two pairs of trousers: one straight, one wide-leg
- A midi skirt
- Three tops: a fine-knit sweater, a shell top and a button-down shirt
- One knit dress
- Two pairs of shoes: [loafers](/shoes/how-to-wear-loafers/) and a low block heel or flat

## Five formulas for five days

1. **Blazer + shell + wide-leg trousers.** The most polished option for presentations.
2. **Fine knit + midi skirt + loafers.** Softer, still smart.
3. **Button-down + straight trousers + flats.** Crisp and easy.
4. **Knit dress + blazer over the shoulders.** One decision, done.
5. **Fine knit + straight trousers.** The Friday version.

## Adjusting for your dress code

Table: Dress codes and how to adapt
| Dress code | Adjust by |
| Business formal | Matching suit, closed-toe heels or polished flats |
| Business casual | Separates, knitwear, loafers |
| Smart casual | Dark denim with a blazer, clean sneakers if accepted |

:::tip Color strategy
Choose one neutral base (navy or black), one lighter neutral (ivory or grey) and a single accent. Everything will mix.
:::

For a bag that keeps up, see [how to choose a work bag](/accessories/how-to-choose-a-work-bag/).`,
  },
  {
    slug: "casual-jeans-outfit-formulas",
    category: "outfits/casual-outfits",
    title: "Casual Outfit Formulas Built on Jeans and a Good T-Shirt",
    subtitle: "The simplest outfit there is, made to look considered.",
    seoTitle: "Casual Outfit Ideas With Jeans and a T-Shirt",
    metaDescription: "Casual outfit formulas built on jeans and a t-shirt: how to choose the fit, add a third piece, and change shoes and accessories to suit the day.",
    contentType: "OUTFIT_GUIDE",
    image: "denim-casual",
    tags: ["casual outfits", "denim"],
    body: `Jeans and a t-shirt is an outfit almost everyone owns. What separates a throw-on from a look is fit, fabric and one finishing piece.

![](media:@@denim-casual@@ wide)

## Get the foundations right

- **Jeans:** a straight or relaxed-straight leg in a mid or dark wash is the most versatile. Check that the hem hits where you want with the shoes you'll wear most.
- **T-shirt:** a heavier cotton holds its shape and looks less like sleepwear. Tuck the front loosely to define the waist.

## Add a third piece

1. **A camel or navy coat** — see [how to style a camel coat](/outfits/how-to-style-a-camel-coat/).
2. **An oversized blazer** for lunch or the office on Friday.
3. **A cardigan** buttoned and worn as a top.
4. **A trench** for spring.

## Change the shoes, change the outfit

Clean [white sneakers](/shoes/white-sneakers-guide/) keep it relaxed, loafers make it smart, and ballet flats make it lighter. The same jeans and tee read differently with each.

:::tip The belt test
If the outfit feels unfinished, add a belt. It's the quickest way to make jeans and a tee look intentional.
:::`,
  },
  {
    slug: "wedding-guest-dress-code-guide",
    category: "outfits/wedding-guest-outfits",
    title: "What to Wear to a Wedding: A Dress Code Decoder",
    subtitle: "From black tie to casual — what each invitation is asking for.",
    seoTitle: "Wedding Guest Dress Codes Explained: What to Wear",
    metaDescription: "A wedding guest dress code guide: what black tie, formal, cocktail, semi-formal and casual mean, plus etiquette on color, shoes and venues.",
    contentType: "EXPLAINER",
    image: "dress-guest",
    tags: ["wedding guest", "dress codes"],
    featured: true,
    body: `Wedding invitations often include a dress code, and decoding it is half the battle. Here is what each common term usually means — always defer to anything specific the couple has shared on their invitation or website.

![](media:@@dress-guest@@)

## The dress codes

Table: Common wedding dress codes
| Dress code | Typically means |
| Black tie | Floor-length gown or very formal cocktail dress |
| Formal / black tie optional | Long dress, dressy midi or elegant jumpsuit |
| Cocktail | Knee to midi-length dress or dressy separates |
| Semi-formal | Cocktail-level, slightly more relaxed |
| Casual | A nice dress or tailored separates; no denim unless invited |

## Etiquette worth knowing

- **Avoid white, ivory and cream** unless the couple asks for it.
- **Check the venue.** Grass and sand call for block heels or flats; a church may call for covered shoulders.
- **Consider the time.** Evening ceremonies tend to be dressier than daytime ones.

:::tip Pack a layer
Venues can be cold in the evening. A wrap or tailored jacket that suits the outfit is better than an emergency cardigan.
:::

## Shoes you can stay in

You'll likely stand and dance for hours. Block heels and dressy flats are kinder than stilettos — see our guide to [ballet flats](/shoes/how-to-style-ballet-flats/) for dressier options.`,
  },
  {
    slug: "how-to-style-a-camel-coat",
    category: "outfits/seasonal-outfits",
    title: "How to Style a Camel Coat Through Fall and Winter",
    subtitle: "One coat, many outfits.",
    seoTitle: "How to Style a Camel Coat: Fall & Winter Outfit Ideas",
    metaDescription: "How to style a camel coat for fall and winter: choosing the length and cut, the colors it pairs best with, and outfit formulas for work and weekends.",
    contentType: "OUTFIT_GUIDE",
    image: "coat-camel",
    tags: ["coats", "fall outfits", "winter outfits"],
    body: `A camel coat works with nearly everything in a neutral wardrobe, which is why it appears in so many cold-weather outfits. Choosing the right cut makes it even more useful.

![](media:@@coat-camel@@)

## Choosing the cut

- **Length:** a coat that ends at or just below the knee covers most hemlines, including midi skirts.
- **Shoulders:** you should be able to wear a sweater underneath without the seams pulling.
- **Closure:** a wrap coat is relaxed; a double-breasted coat is more structured.

## Colors that pair beautifully

Table: Camel coat color pairings
| Pair with | The effect |
| Black | Sharp, high contrast |
| Cream and ivory | Soft, tonal |
| Grey | Cool and modern |
| Navy | Classic |
| Chocolate brown | Rich, warm tonal look |

## Outfit formulas

1. **Black knit + straight trousers + loafers** for the office.
2. **Jeans + white tee + sneakers** — see more [jeans outfit formulas](/outfits/casual-jeans-outfit-formulas/).
3. **Midi knit dress + knee boots** — the [boots guide](/shoes/knee-high-boots-guide/) covers fit.

:::note Care
Brush wool coats after wear and hang them on a wide hanger. Spot-clean promptly and follow the care label for professional cleaning.
:::`,
  },
  {
    slug: "how-to-wear-loafers",
    category: "shoes/loafers",
    title: "How to Wear Loafers With Jeans, Skirts and Tailoring",
    subtitle: "The flat shoe that dresses up and down.",
    seoTitle: "How to Wear Loafers: Outfit Ideas With Jeans, Skirts & Trousers",
    metaDescription: "How to wear loafers with jeans, skirts, dresses and tailored trousers, plus what to look for in fit and which socks to wear with them.",
    contentType: "HOW_TO",
    image: "loafer",
    tags: ["loafers", "shoe styling"],
    featured: true,
    body: `Loafers sit between a sneaker and a dress shoe, which makes them one of the most flexible pairs you can own. They make casual outfits look neater and tailored outfits feel less stiff.

![](media:@@loafer@@ wide)

## With jeans

Straight and slightly cropped jeans show off the shoe. A small gap of ankle — or a fine sock — keeps the look light. Wider jeans work too; let the hem just graze the top of the loafer.

## With skirts and dresses

A midi skirt and loafers is an easy weekday outfit. With a dress, a chunkier sole balances fuller skirts, while a slim sole suits sleeker shapes.

## With tailoring

Loafers soften a suit or tailored trousers. Hem trousers so they break lightly over the shoe — see our [week of work outfits](/outfits/work-outfit-ideas/) for formulas.

:::tip Socks or no socks?
Bare ankles or no-show socks look clean. A visible fine-knit sock in a contrast color can be a deliberate styling choice in cooler months.
:::

## What to look for

- The heel shouldn't slip as you walk.
- Leather loafers may relax slightly with wear, so a snug (not painful) fit is common.
- A rubber sole or added grip helps on slick pavements.`,
  },
  {
    slug: "white-sneakers-guide",
    category: "shoes/sneakers",
    title: "White Sneakers: How to Choose a Pair and Keep Them Clean",
    subtitle: "The everyday shoe, chosen carefully.",
    seoTitle: "White Sneakers Guide: Choosing, Styling & Cleaning",
    metaDescription: "How to choose white sneakers — leather or canvas, sole shape and fit — how to style them, and simple cleaning steps to keep them looking fresh.",
    contentType: "HOW_TO",
    image: "sneaker",
    tags: ["sneakers", "shoe care"],
    body: `A clean white sneaker works with jeans, dresses and relaxed tailoring. The details — material, sole and shape — decide whether they look sporty or minimal.

![](media:@@sneaker@@)

## Choosing a pair

Table: Leather vs. canvas sneakers
| | Leather | Canvas |
| Look | Sleek, minimal | Casual, relaxed |
| Cleaning | Wipes clean | Needs washing |
| Warm weather | Warmer | More breathable |

Look for a slim, low profile if you want them to pair with smarter outfits; a chunkier sole reads more casual.

## How to style them

- With [jeans and a tee](/outfits/casual-jeans-outfit-formulas/) for the obvious, reliable choice.
- With a slip dress or midi skirt for contrast.
- With wide-leg trousers and a blazer where your workplace allows.

## Keeping them white

1. Brush off dirt once dry.
2. Wipe leather uppers with a damp cloth and a little mild soap.
3. Clean soles with a soft brush.
4. Stuff with paper and air-dry away from direct heat.

:::tip Protect early
A protective spray suited to the material, applied before the first wear, makes future cleaning easier. Check the manufacturer's care guidance first.
:::`,
  },
  {
    slug: "knee-high-boots-guide",
    category: "shoes/boots",
    title: "Knee-High Boots: A Fit and Styling Guide",
    subtitle: "Getting the shaft, heel and hemline right.",
    seoTitle: "Knee-High Boots: How to Find the Right Fit & Style Them",
    metaDescription: "How to choose knee-high boots that fit — shaft height and circumference, heel types — and how to style them with skirts, dresses and jeans.",
    contentType: "HOW_TO",
    image: "boot",
    tags: ["boots", "fall outfits"],
    body: `Knee-high boots are a cold-weather staple, but fit makes or breaks them. Two measurements matter most: shaft height and calf circumference.

![](media:@@boot@@)

## Getting the fit right

- **Shaft height** should end just below the bend of the knee so you can sit comfortably.
- **Calf circumference:** measure the widest part of your calf and compare it with the brand's listed shaft circumference. Many brands offer wide or slim calf options.
- **Heel:** a block heel is easier to walk in than a stiletto, and a flat riding boot is the most practical.

## How to style them

1. **With a midi skirt or dress:** let the hem overlap the top of the boot slightly so no skin shows — a sleek, cold-weather look.
2. **With a knee-length dress:** a small gap above the boot looks intentional.
3. **Over slim jeans:** tuck skinny or slim jeans in for a classic riding-boot look.

:::note Weather
Suede needs protection from rain and salt. Smooth leather is easier to wipe clean in winter.
:::

Pair them with a [camel coat](/outfits/how-to-style-a-camel-coat/) for an easy fall uniform.`,
  },
  {
    slug: "how-to-style-ballet-flats",
    category: "shoes/flats",
    title: "How to Wear Ballet Flats Without Looking Dated",
    subtitle: "Proportion is everything.",
    seoTitle: "How to Wear Ballet Flats: Modern Outfit Ideas",
    metaDescription: "How to wear ballet flats in a modern way: which trousers and skirts to pair them with, how socks change the look, and what to look for in fit.",
    contentType: "HOW_TO",
    image: "flat",
    tags: ["ballet flats", "flats", "shoe styling"],
    body: `Ballet flats are light and comfortable. Styled with the right proportions, they look fresh rather than like a throwback.

![](media:@@flat@@ wide)

## Proportions that work

- **Wide-leg or straight trousers** that end at the ankle show the shoe and balance its delicacy.
- **Midi skirts** pair naturally with the low profile.
- **Straight jeans** with a cropped hem keep the look relaxed.

## Details that modernize them

A slightly elongated toe looks sleeker than a very round one. Thin straps or a small bow add interest without fuss.

:::tip With socks
A fine white or patterned sock worn with flats is a deliberate styling choice — it works best with a cropped trouser or a skirt.
:::

## Fit and comfort

Flats have little structure, so fit matters. The heel should stay in place as you walk, and the toe box shouldn't press. A cushioned insole can add support.

For dressier events, flats are an alternative to heels — see our [wedding guest dress code guide](/outfits/wedding-guest-dress-code-guide/).`,
  },
  {
    slug: "bob-haircut-guide",
    category: "hairstyles/short-hairstyles",
    title: "Bob Haircuts: How to Choose the Right Length and Shape",
    subtitle: "What to ask your stylist — and how much styling to expect.",
    seoTitle: "Bob Haircut Guide: Lengths, Shapes & Styling",
    metaDescription: "How to choose a bob haircut: chin-length, lob and blunt versus layered bobs, how they work with different hair textures, and what to tell your stylist.",
    contentType: "EXPLAINER",
    image: "hair-bob",
    tags: ["bob haircut", "short hairstyles"],
    body: `"Bob" covers a wide family of cuts. Knowing the variations helps you describe exactly what you want.

![](media:@@hair-bob@@)

## Lengths

Table: Bob lengths
| Cut | Length | Feel |
| Chin bob | At the jaw | Crisp and graphic |
| Classic bob | Between jaw and shoulders | Versatile |
| Lob (long bob) | Grazing the shoulders | Easy to tie back |

## Blunt or layered?

A **blunt bob** is cut to one length for a strong line; it can make fine hair look fuller at the ends. A **layered bob** removes weight and adds movement, which can help thick or wavy hair sit better.

## Texture matters

Curly and coily hair shrinks as it dries, so a stylist experienced with your texture may cut it dry or allow for shrinkage. Straight hair shows every line, so precision matters.

:::tip Bring two photos
Show your stylist a photo of what you want and one of what you don't. It clarifies more than a description.
:::

## Styling time

A blunt bob on straight hair can be air-dried and finished with a flat iron. Layered and wavy bobs may need a little texture product.`,
  },
  {
    slug: "simple-skincare-routine",
    category: "beauty/skincare-basics",
    title: "A Simple Skincare Routine: The Steps and What Each Is For",
    subtitle: "Cleanse, moisturize, protect — and when to see a professional.",
    seoTitle: "Simple Skincare Routine: Cleanser, Moisturizer & Sunscreen",
    metaDescription: "A simple skincare routine explained: what cleanser, moisturizer and sunscreen each do, how to order them, and when to see a board-certified dermatologist.",
    contentType: "EXPLAINER",
    image: "skincare",
    tags: ["skincare", "beauty basics"],
    body: `A skincare routine doesn't need many steps. Most routines are built around three: cleansing, moisturizing and sun protection.

![](media:@@skincare@@)

## The three core steps

1. **Cleanse.** A gentle cleanser removes dirt, oil and sunscreen. Many people cleanse in the evening and simply rinse or cleanse lightly in the morning.
2. **Moisturize.** Moisturizer helps support the skin's barrier. Lighter lotions and gels are often preferred for oily skin; richer creams for dry skin.
3. **Protect.** In the morning, finish with a broad-spectrum sunscreen. The American Academy of Dermatology recommends SPF 30 or higher for everyday use.

## Order of application

Apply products from thinnest to thickest: cleanser, any treatment serum, moisturizer, then sunscreen in the morning.

:::note Introduce one product at a time
Adding new products one at a time, a week or two apart, makes it easier to tell what's working — or irritating.
:::

## When to see a professional

If you have persistent acne, redness, irritation or any concern about a mole or skin change, see a board-certified dermatologist. This article is general information, not medical advice.`,
  },
  {
    slug: "how-to-choose-a-work-bag",
    category: "accessories/handbags",
    title: "How to Choose a Work Bag That Lasts",
    subtitle: "Size, structure and materials, considered.",
    seoTitle: "How to Choose a Work Bag: Size, Structure & Materials",
    metaDescription: "How to choose a work bag that lasts: sizing for a laptop, structured versus soft bags, leather and alternative materials, and construction details to check.",
    contentType: "HOW_TO",
    image: "bag",
    tags: ["handbags", "work outfits"],
    body: `A work bag gets carried every day, so it needs to be the right size, comfortable and well made.

![](media:@@bag@@)

## Start with what you carry

Make a list: laptop, charger, notebook, water bottle, lunch? Measure your laptop and check the bag's interior dimensions, not just the exterior.

## Structured or soft?

Table: Structured vs. soft work bags
| | Structured | Soft |
| Look | Polished, sits upright | Relaxed |
| Protection | Better for laptops | Usually needs a sleeve |
| Weight | Often heavier | Usually lighter |

## Construction details to check

- **Handles and straps:** check how they're attached. Stitched and reinforced attachment points last longer.
- **Strap drop:** make sure the bag fits on your shoulder over a coat.
- **Interior:** pockets for keys and phone save rummaging.
- **Base:** feet or a reinforced base protect the bag when set down.

:::tip Color
Black, brown and tan go with everything. Cognac leather pairs well with both navy and black tailoring.
:::

Building out your work wardrobe? Start with our [week of work outfits](/outfits/work-outfit-ideas/).`,
  },
  {
    slug: "gold-hoop-earrings-guide",
    category: "accessories/jewelry",
    title: "Gold Hoop Earrings: How to Choose Size and Thickness",
    subtitle: "The everyday earring, in proportion.",
    seoTitle: "Gold Hoop Earrings Guide: Size, Thickness & Materials",
    metaDescription: "How to choose gold hoop earrings: sizes from huggies to statement hoops, thickness, solid gold versus plated, and how to style hoops every day.",
    contentType: "EXPLAINER",
    image: "hoops",
    tags: ["jewelry", "earrings"],
    body: `Gold hoops are one of the most-worn pieces of jewelry. Choosing the right size and thickness determines whether they read as subtle or statement.

![](media:@@hoops@@ wide)

## Sizes

- **Huggies** sit close to the lobe — easy to sleep and work out in.
- **Small hoops** (around the size of a coin) are everyday pieces.
- **Medium and large hoops** make more of a statement and frame the face.

## Thickness

Thin hoops look delicate; thicker, chunkier hoops look bolder at the same diameter. A chunky small hoop is a good middle ground.

## Materials

Table: Gold jewelry materials
| Material | What it means |
| Solid gold (e.g. 14k) | Gold alloy throughout; most durable |
| Gold filled | A thick layer of gold bonded to a base metal |
| Gold plated / vermeil | A thinner gold layer; may wear over time |

:::note Sensitive ears?
If you react to some earrings, look for clearly labeled materials and ask a doctor if irritation continues.
:::

Hoops pair with almost anything — from [work outfits](/outfits/work-outfit-ideas/) to weekend denim.`,
  },
];
