import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head, Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import Image from 'next/image'
 
export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
  title: 'Nextra Documentation',
  description: 'Documentation for the project ...',
}
 
const banner = <Banner storageKey="some-key">My project 1.0.0 is released 🎉</Banner>
const navbar = (
  <Navbar
    logo={<Image src="/IPSMultisalud.bin" alt="Logo" width={130} height={130} />}
    logoLink={"https://github.com/MiguelMorales1125/Project-proof"}
    projectLink="https://github.com/MiguelMorales1125/Project-proof"
  />
)
const footer = <Footer>MIT {new Date().getFullYear()} © IPSMultisalud.</Footer>

const search = <Search placeholder="Buscar documentación"></Search>

import { ReactNode } from 'react'

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
      // ... Your additional head options
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/MiguelMorales1125/Project-proof"
          footer={footer}
          search={search}
          editLink={null}
          feedback={{content:null}}
          // ... Your additional layout options
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}