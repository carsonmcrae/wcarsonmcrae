# Wireframes, version 1

The first wireframes for the timeline-first redesign: Carson's profile as a page on a social
network where every post sits at its real date, with zoom and category filters.

They were drawn on a design canvas (private link: https://claude.ai/artifact/56DgMWa1UerzcCcs56cWQZ)
and are kept here as the record of the approved structure. Each `.dc.html` file is one artboard in
the canvas's own component format; `canvas.json` holds their layout and the notes. They are not part
of the site build and are not served.

The desktop header and shared control-group resets live in `wireframe-shell.css`; keep that file
beside the HTML when opening or sharing these historical previews. Native fieldsets retain the
original invisible group labels. The referenced `support.js` is the design canvas’s external
runtime and was not supplied with this archive; static HTML previews remain readable, while the
`text/x-dc` filter/zoom logic requires that original runtime.

| File               | Screen                                                          |
| ------------------ | --------------------------------------------------------------- |
| `Main.dc.html`     | Profile and timeline feed, desktop, interactive (filters, zoom) |
| `Post.dc.html`     | A post's own page, desktop                                      |
| `Mobile.dc.html`   | Profile and feed on a phone                                     |
| `ListView.dc.html` | The plain-list fallback (no JavaScript, screen readers, print)  |

The full brief given to the design agent for the next round is in [`../design-brief.md`](../design-brief.md).
