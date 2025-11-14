export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Jaga Kali Pekalongan</h3>
            <p className="text-sm text-muted-foreground">
              Platform pelaporan sampah untuk menjaga kelestarian Sungai Pekalongan.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Menu</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/" className="hover:text-foreground transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="/peta" className="hover:text-foreground transition-colors">
                  Peta
                </a>
              </li>
              <li>
                <a href="#statistik" className="hover:text-foreground transition-colors">
                  Statistik
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Kontak</h4>
            <p className="text-sm text-muted-foreground">
              Email: info@jagakali.local
              <br />
              Telepon: (0284) 123-456
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Jaga Kali Pekalongan. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
