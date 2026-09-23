/** The website and Capacitor app intentionally share this page and its copy. */
export function AboutPage() {
  return (
    <section className="about-page" aria-labelledby="about-page-title">
      <article className="about-card">
        <header className="about-card-header">
          <h1 id="about-page-title">chewmash</h1>
          <p>est. 2026</p>
        </header>

        <div className="about-card-copy">
          <p>
            Cal Poly sits on the traditional lands of the yak titʸu titʸu yak tiłhini Northern Chumash Tribe of San Luis Obispo County and Region. The yak titʸu titʸu yak tiłhini have a documented presence in this area for over 10,000 years. The tiłhini peoples have stewarded their ancestral and unceded homelands, encompassing the cities, communities, and federal and state open spaces of the San Luis Obispo County region. Their homelands reach east into the Carrizo Plains toward Kern County, south to the Santa Maria River, north to Ragged Point, and west beyond the ocean’s shoreline, in an unbroken chain of lineage, kinship, and culture.
          </p>
          <p>
            The name chewmash was chosen with the intention of honoring the Indigenous peoples of this region, never to mock, trivialize, or disrespect them. This is an independent dining app; its name does not imply that the Tribe, Cal Poly, or the Native American &amp; Indigenous Cultural Center endorses or is affiliated with the app.
          </p>
          <p>
            Land acknowledgment is only a starting point. To learn about Native American &amp; Indigenous Cultural Center events and workshops, follow Cal Poly’s NAICC on Instagram at{' '}
            <a href="https://www.instagram.com/calpoly_naicc/" target="_blank" rel="noopener noreferrer">@calpoly_naicc</a>.
          </p>
          <p className="about-source">
            Adapted from{' '}
            <a href="https://scholars.calpoly.edu/landacknowledgment" target="_blank" rel="noopener noreferrer">Cal Poly’s land acknowledgment</a>.
          </p>
        </div>
      </article>
    </section>
  );
}
