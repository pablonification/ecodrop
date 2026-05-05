import { ArrowLeft, Clock3, Search, Share2 } from "lucide-react";
import type { EducationArticle } from "@ecodrop/shared";
import { figmaAssets } from "../assets/figma";

type EducationScreenProps = {
  articles: EducationArticle[];
  selected: EducationArticle | null;
  onSelect: (article: EducationArticle) => void;
  onBack: () => void;
};

const educationCards = [
  {
    title: "Manfaat Daur Ulang",
    excerpt: "Pelajari bagaimana kontribusi kecil Anda menyelamatkan...",
    readTime: "5 MIN BACA"
  },
  {
    title: "Kode Plastik 101",
    excerpt: "Mengenal jenis-jenis plastik melalui simbol angka di...",
    readTime: "3 MIN BACA"
  },
  {
    title: "Zero Waste Lifestyle",
    excerpt: "Tips memulai hidup tanpa sampah dari dapur rumah...",
    readTime: "8 MIN BACA"
  },
  {
    title: "Zero Waste Lifestyle",
    excerpt: "Tips memulai hidup tanpa sampah dari dapur rumah...",
    readTime: "8 MIN BACA"
  }
];

export function EducationScreen({ articles, selected, onSelect, onBack }: EducationScreenProps) {
  const fallbackArticle = articles[0];

  if (selected) {
    return <ArticleDetailView onBack={onBack} />;
  }

  return (
    <div className="education-screen">
      <header className="education-topbar">
        <h1>Edukasi</h1>
      </header>

      <label className="education-search">
        <Search size={18} />
        <input placeholder="Cari topik edukasi" />
      </label>

      <div className="education-chip-row" aria-label="Kategori edukasi">
        <button className="active">Semua</button>
        <button>Pilah Sampah</button>
        <button>Botol Plastik</button>
        <button>Daur Ulang</button>
        <button>Eco Tips</button>
      </div>

      <button className="education-featured-card" onClick={() => fallbackArticle && onSelect(fallbackArticle)}>
        <img src={figmaAssets.educationFeatured} alt="" />
        <span>Unggulan</span>
        <h2>Cara memilah plastik rumah tangga dengan benar</h2>
      </button>

      <section className="education-list" aria-label="Untuk kamu">
        {educationCards.map((card, index) => (
          <button className="education-card" key={`${card.title}-${index}`} onClick={() => fallbackArticle && onSelect(fallbackArticle)}>
            <img src={figmaAssets.educationRecycling[index % figmaAssets.educationRecycling.length]} alt="" />
            <span>
              <strong>{card.title}</strong>
              <small>{card.excerpt}</small>
              <em>
                <Clock3 size={12} />
                {card.readTime}
              </em>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}

function ArticleDetailView({ onBack }: { onBack: () => void }) {
  return (
    <article className="article-detail-screen">
      <header className="article-detail-topbar">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={16} />
        </button>
        <h1>Detail Artikel</h1>
        <button aria-label="Bagikan artikel">
          <Share2 size={18} />
        </button>
      </header>

      <img className="article-detail-hero" src={figmaAssets.articleDetailHero} alt="" />

      <section className="article-detail-intro">
        <div className="article-meta-row">
          <span>Daur Ulang</span>
          <small>
            <Clock3 size={12} />
            3 Min Baca
          </small>
        </div>
        <h2>Manfaat Daur Ulang untuk Lingkungan Masa Depan</h2>
        <div className="article-author">
          <span>
            <img src={figmaAssets.articleNoteIcon} alt="" />
          </span>
          <div>
            <strong>Tim Edukasi EcoDrop</strong>
            <small>Dipublikasikan 15 Okt 2024</small>
          </div>
        </div>
      </section>

      <section className="article-body">
        <p className="lead">
          Daur ulang bukan hanya sekadar tren, melainkan sebuah kebutuhan mendesak untuk menjaga kelestarian bumi. Dengan
          mendaur ulang, kita tidak hanya mengurangi tumpukan sampah, tetapi juga menyelamatkan sumber daya alam yang semakin
          menipis.
        </p>

        <h3>Mengapa Kita Harus Mulai Sekarang?</h3>
        <p>
          Setiap tahun, jutaan ton sampah plastik berakhir di lautan, mengancam kehidupan ekosistem laut. Proses pembuatan
          produk dari bahan mentah juga membutuhkan energi yang jauh lebih besar dibandingkan dengan menggunakan bahan daur
          ulang.
        </p>
        <p>
          Selain menghemat energi, daur ulang berkontribusi signifikan dalam mengurangi emisi gas rumah kaca. Tahukah Anda
          bahwa mendaur ulang satu botol plastik dapat menghemat energi yang cukup untuk menyalakan bola lampu 60 watt selama
          6 jam?
        </p>

        <aside className="article-note">
          <img src={figmaAssets.articleNoteIcon} alt="" />
          <span>
            <strong>Catatan Penting</strong>
            <small>
              Pastikan botol plastik dalam keadaan kosong dan bersih sebelum disetorkan ke Smart Bin EcoDrop untuk memastikan
              kualitas daur ulang yang optimal.
            </small>
          </span>
        </aside>

        <h3>Dampak Nyata yang Anda Buat</h3>
        <p>
          Melalui platform EcoDrop, kontribusi kecil Anda tercatat dan memberikan dampak nyata. Setiap poin yang Anda kumpulkan
          mencerminkan jumlah karbon yang berhasil dicegah untuk mencemari udara kita. Mari jadikan daur ulang sebagai gaya
          hidup.
        </p>
      </section>

      <section className="related-articles">
        <div>
          <h3>Artikel Terkait</h3>
          <button>Lihat Semua</button>
        </div>
        <div className="related-scroll">
          <RelatedCard image={figmaAssets.articleRelated[0]} label="Panduan" title="Cara Efektif Memilah Sampah Rumah Tangga" time="2 Min Baca" />
          <RelatedCard image={figmaAssets.articleRelated[1]} label="Inovasi" title="Mengubah Sampah Plastik Menjadi Produk Bernilai" time="4 Min Baca" />
        </div>
      </section>
    </article>
  );
}

function RelatedCard({ image, label, title, time }: { image: string; label: string; title: string; time: string }) {
  return (
    <article className="related-card">
      <img src={image} alt="" />
      <span>{label}</span>
      <strong>{title}</strong>
      <small>{time}</small>
    </article>
  );
}
