import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import type { EducationArticle } from "@ecodrop/shared";

type EducationScreenProps = {
  articles: EducationArticle[];
  selected: EducationArticle | null;
  onSelect: (article: EducationArticle) => void;
  onBack: () => void;
};

export function EducationScreen({ articles, selected, onSelect, onBack }: EducationScreenProps) {
  if (selected) {
    return (
      <article className="article-detail">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={20} />
          Artikel
        </button>
        <div className="article-cover">
          <BookOpen size={72} />
        </div>
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
      <section className="education-hero">
        <span>Artikel Pilihan</span>
        <h2>Kelola sampah plastik dari rumah</h2>
        <p>Tips ringkas untuk membuat setoran EcoDrop lebih bersih dan bernilai.</p>
      </section>
      {articles.map((article) => (
        <button className="article-row" key={article.id} onClick={() => onSelect(article)}>
          <span className="article-thumb">
            <BookOpen size={22} />
          </span>
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
