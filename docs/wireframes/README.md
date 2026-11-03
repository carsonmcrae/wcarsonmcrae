# Wireframes, version 1

The first wireframes for the timeline-first redesign: Carson's profile as a page on a social
network where every post sits at its real date, with zoom and category filters.

They were drawn on a design canvas (private link: https://claude.ai/artifact/56DgMWa1UerzcCcs56cWQZ)
and are kept here as the record of the approved structure. Each `.dc.html` file is one artboard in
the canvas's own component format; `canvas.json` holds their layout and the notes. They are not part
of the site build and are not served.

| File               | Screen                                                          |
| ------------------ | --------------------------------------------------------------- |
| `Main.dc.html`     | Profile and timeline feed, desktop, interactive (filters, zoom) |
| `Post.dc.html`     | A post's own page, desktop                                      |
| `Mobile.dc.html`   | Profile and feed on a phone                                     |
| `ListView.dc.html` | The plain-list fallback (no JavaScript, screen readers, print)  |

The full brief given to the design agent for the next round is in [`../design-brief.md`](../design-brief.md).
