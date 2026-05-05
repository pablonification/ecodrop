import { ArrowLeft, ChevronRight } from "lucide-react";
import type { EducationArticle } from "@ecodrop/shared";
import { figmaAssets } from "../assets/figma";

type EducationScreenProps = {
  articles: EducationArticle[];
  selected: EducationArticle | null;
  onSelect: (article: EducationArticle) => void;
  onBack: () => void;
};

export function EducationScreen({ articles, selected, onSelect, onBack }: EducationScreenProps) {
  if (selected) {
    const selectedIndex = Math.max(0, articles.findIndex((article) => article.id === selected.id));
    const cover = figmaAssets.educationThumbs[selectedIndex % figmaAssets.educationThumbs.length];
    return (
      <article className="article-detail">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={20} />
          Artikel
        </button>
        <img className="article-cover" src={cover} alt="" />
        <span className="category-pill">{selected.category}</span>
        <h1>{selected.title}</h1>
        <p className="article-lead">{selected.excerpt}</p>
        <p>{selected.content}</p>
        <p>
          EcoDrop menggunakan edukasi singkat agar pengguna dapat memilah plastik PET sebelum
          menyetor botol ke SmartBin.
        </p>
      </article>
    );
  }

  return (
    <div className="screen-stack">
      <h1 className="screen-title">Edukasi</h1>
      <button
        className="figma-image-card education-hero"
        onClick={() => articles[0] && onSelect(articles[0])}
        style={{ backgroundImage: `url(${figmaAssets.educationHero})` }}
        aria-label="Artikel unggulan: Cara memilah plastik rumah tangga dengan benar"
      />
      {articles.map((article, index) => (
        <button className="article-row" key={article.id} onClick={() => onSelect(article)}>
          <img
            className="article-thumb"
            src={figmaAssets.educationThumbs[index % figmaAssets.educationThumbs.length]}
            alt=""
          />
          <span>
            <strong>{article.title}</strong>
            <small>{article.excerpt}</small>
          </span>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  );
}
