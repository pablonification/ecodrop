import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ArrowLeft, Clock3, Download, Link2, Search, Send, Share2, X } from "lucide-react";
import type { EducationArticle } from "@ecodrop/shared";
import { figmaAssets } from "../assets/figma";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const shareArticle = selected ?? fallbackArticle;
  const shareUrl = useMemo(
    () => (shareArticle ? `https://ecodrop.app/education/${shareArticle.id}` : "https://ecodrop.app/education"),
    [shareArticle]
  );

  useEffect(() => {
    if (!selected) setShareOpen(false);
  }, [selected]);

  async function handleCopyLink() {
    if (!shareArticle) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Tautan berhasil disalin.");
    } catch {
      setShareMessage("Gagal menyalin tautan.");
    }
  }

  async function handleNativeShare() {
    if (!shareArticle) return;
    const share = (navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    }).share;
    if (share) {
      try {
        await share({
          title: shareArticle.title,
          text: shareArticle.excerpt,
          url: shareUrl
        });
        setShareMessage("Bagikan artikel berhasil.");
        return;
      } catch {
        setShareMessage("Bagikan artikel dibatalkan.");
        return;
      }
    }
    await handleCopyLink();
  }

  async function handleDownload() {
    if (!shareArticle) return;
    const target = articleRef.current;
    if (!target) {
      setShareMessage("Gagal membuat PDF.");
      return;
    }
    try {
      await exportArticlePdf(target, shareArticle.title);
      setShareMessage("Ringkasan artikel diunduh.");
    } catch {
      setShareMessage("Gagal membuat PDF.");
    }
  }

  if (selected) {
    return (
      <>
        <ArticleDetailView
          article={selected}
          onBack={onBack}
          onShare={() => {
            setShareOpen(true);
            setShareMessage(null);
          }}
          contentRef={articleRef}
        />
        {shareOpen && shareArticle && (
          <ShareSheet
            article={shareArticle}
            message={shareMessage}
            onClose={() => setShareOpen(false)}
            onCopyLink={handleCopyLink}
            onDownload={handleDownload}
            onShare={handleNativeShare}
          />
        )}
      </>
    );
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

function ArticleDetailView({
  article,
  onBack,
  onShare,
  contentRef
}: {
  article: EducationArticle;
  onBack: () => void;
  onShare: () => void;
  contentRef: RefObject<HTMLElement | null>;
}) {
  return (
    <article className="article-detail-screen" ref={contentRef}>
      <header className="article-detail-topbar">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={16} />
        </button>
        <h1>Detail Artikel</h1>
        <button aria-label="Bagikan artikel" onClick={onShare}>
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
        <h2>{article.title}</h2>
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
        <p className="lead">{article.excerpt}</p>

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
        <p>{article.content}</p>
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

function ShareSheet({
  article,
  message,
  onClose,
  onCopyLink,
  onDownload,
  onShare
}: {
  article: EducationArticle;
  message: string | null;
  onClose: () => void;
  onCopyLink: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="share-sheet-backdrop" onClick={onClose}>
      <section className="share-sheet" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Bagikan Artikel</span>
            <strong>{article.title}</strong>
          </div>
          <button onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        <div className="share-options">
          <button onClick={onShare}>
            <Send size={18} />
            Bagikan
          </button>
          <button onClick={onCopyLink}>
            <Link2 size={18} />
            Salin Tautan
          </button>
          <button onClick={onDownload}>
            <Download size={18} />
            Unduh Ringkasan
          </button>
        </div>
        {message && <p className="share-message">{message}</p>}
      </section>
    </div>
  );
}

async function exportArticlePdf(element: HTMLElement, title: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#f8fafc",
    useCORS: true
  });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let remainingHeight = imgHeight;
  let position = 0;

  pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    position = -(imgHeight - remainingHeight);
    pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  const safeTitle = title.replace(/\s+/g, "-").toLowerCase();
  pdf.save(`${safeTitle}.pdf`);
}
