import { useRef } from "react";
import { Link } from "react-router-dom";
import useEditorialReveal from "../hooks/useEditorialReveal";
import ResponsiveImage from "./ResponsiveImage";
import "./EditorialPhotoSection.css";

function EditorialHeadline({ headline }) {
  return (
    <h2 className="editorial-story-heading">
      {headline.split("\n").map((line) => (
        <span className="editorial-story-heading-mask" key={line}>
          <span data-editorial-headline-line>{line}</span>
        </span>
      ))}
    </h2>
  );
}

function EditorialPhoto({ image, alt }) {
  return (
    <div className="editorial-story-image-frame" data-editorial-photo>
      <ResponsiveImage data-editorial-image data-editorial-parallax src={image.src} alt={alt} width={image.width} height={image.height} sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
  );
}

export function EditorialFeature({ eyebrow, headline, body, ctaText, ctaLink, image, alt, reverse = false }) {
  const sectionRef = useRef(null);
  useEditorialReveal(sectionRef);

  return (
    <section
      ref={sectionRef}
      className={`editorial-story-feature${reverse ? " editorial-story-feature--reverse" : ""}`}
      aria-label={headline.replace("\n", " ")}
    >
      <div className="container-page editorial-story-feature-inner">
        <div className="editorial-story-copy">
          <p className="editorial-story-eyebrow" data-editorial-eyebrow>{eyebrow}</p>
          <EditorialHeadline headline={headline} />
          <p className="editorial-story-body" data-editorial-paragraph>{body}</p>
          <Link to={ctaLink} className="editorial-story-link" data-editorial-link>
            {ctaText}<span className="editorial-story-link-arrow" aria-hidden="true">→</span>
            <span className="editorial-story-link-underline" data-editorial-underline aria-hidden="true" />
          </Link>
        </div>
        <div className="editorial-story-photo-column">
          <EditorialPhoto image={image} alt={alt} />
        </div>
      </div>
    </section>
  );
}

export function EditorialLookbook({ eyebrow, headline, images }) {
  const sectionRef = useRef(null);
  useEditorialReveal(sectionRef);

  return (
    <section ref={sectionRef} className="editorial-story-lookbook" aria-label={headline.replace("\n", " ")}>
      <div className="container-page editorial-story-lookbook-inner">
      <header className="editorial-story-lookbook-heading">
        <p className="editorial-story-eyebrow" data-editorial-eyebrow>{eyebrow}</p>
        <EditorialHeadline headline={headline} />
      </header>
      <div className="editorial-story-lookbook-grid">
        {images.map((item, index) => (
          <figure className="editorial-story-lookbook-item" key={item.src}>
            <EditorialPhoto image={item} alt={item.alt} />
            <figcaption className="editorial-story-lookbook-caption">{item.caption}</figcaption>
          </figure>
        ))}
      </div>
      </div>
    </section>
  );
}
