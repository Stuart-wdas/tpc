# TPC visual direction

The site should feel like a welcoming neighbourhood invitation: warm, human and easy to navigate. Cream surfaces, editorial serif headings, quiet borders and candid gathering photography keep red, yellow and blue present without filling every surface with primary colour.

## Research informing the design

- [Material Design colour roles](https://m3.material.io/styles/color/the-color-system): separate neutral surfaces from accent and container roles. TPC uses cream and white for the majority of surfaces, red for primary member actions, blue for business actions and links, and yellow for occasional decorative moments and pending states.
- [US Web Design System colour overview](https://designsystem.digital.gov/design-tokens/color/overview/): semantic colour roles and a coordinated token system make consistent use easier. Shared CSS variables define the brand palette, foreground, muted text and borders.
- [University of Michigan Library colour guidance](https://design-system.lib.umich.edu/visual-elements/colors/): yellow with white is unsuitable for readable text. TPC uses dark ink on yellow and reserves the bright yellow for small decorative shapes and a brief hero message.
- [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [database migrations](https://better-auth.com/docs/concepts/database) and [username plugin](https://better-auth.com/docs/plugins/username) informed the authentication implementation, including placing the auth handler before JSON parsing and checking sessions on the server.

Research accessed 19 October 2026. This is a custom design, with no copied page template.

## Tokens and behaviour

| Role   | Colour    | Use                                                      |
| ------ | --------- | -------------------------------------------------------- |
| Paper  | `#f8f6f0` | Main background                                          |
| Ink    | `#262c2a` | Body and headings                                        |
| Muted  | `#656b65` | Supporting text                                          |
| Red    | `#b6372e` | Member actions, editorial emphasis, selected accents     |
| Blue   | `#264f9e` | Business actions, links, focus rings, navigation accents |
| Yellow | `#efc84a` | Small illustrations, sticker, dots                       |

Georgia gives the display typography a personable editorial feel; Segoe UI/Arial handles app controls and body text. Both use local system fonts. Photos are served locally, with restrained saturation. Desktop uses a spacious grid, while phones stack content and expose persistent bottom navigation. Inputs have visible labels; buttons use text as well as icons; status includes words as well as colour; keyboard focus has an explicit ring; reduced-motion preferences disable animation.

This is not a claim of a completed accessibility certification. The browser tests check actual mobile overflow and usable flows, and API tests check the access controls behind the screens.
