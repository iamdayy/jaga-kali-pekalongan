import { MapPin, Zap, MessageSquare, Shield } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: MapPin,
      title: "Peta Interaktif",
      description: "Lihat lokasi semua laporan sampah di Sungai Pekalongan dengan detail lengkap.",
    },
    {
      icon: Zap,
      title: "Lapor Instan",
      description: "Laporkan menemukan sampah langsung dari ponsel Anda dengan foto dan lokasi.",
    },
    {
      icon: MessageSquare,
      title: "Validasi Komunitas",
      description: "Masyarakat dapat mengkonfirmasi laporan dan memprioritaskan pembersihan.",
    },
    {
      icon: Shield,
      title: "Transparan & Aman",
      description: "Laporan anonim tersedia untuk menjaga privasi sambil mengutamakan transparansi.",
    },
  ]

  return (
    <section id="fitur" className="py-12 md:py-24 bg-gradient-to-b from-background to-teal-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Fitur Unggulan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Teknologi yang memudahkan masyarakat mengawasi dan menjaga kelestarian sungai
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-8 hover:shadow-lg transition-shadow"
              >
                <Icon className="h-8 w-8 text-teal-600 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
