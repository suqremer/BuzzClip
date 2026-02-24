export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        header, footer, nav.fixed.bottom-0 { display: none !important; }
        main { padding-bottom: 0 !important; min-height: auto !important; }
      `}</style>
      {children}
    </>
  );
}
