import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import Image from "next/image";
import type { ReactNode } from "react";
import type { PageMapItem } from "nextra";
import "./globals.css";

export const metadata = {
  title: "Nextra Documentation",
  description: "Documentation for the project ...",
};

const banner = (
  <Banner storageKey="some-key">
    Bienvenido a la documentación de IPSmultisalud🎉
  </Banner>
);

const navbar = (
  <Navbar
    logo={
      <Image src="/IPSMultisalud.png" alt="Logo" width={130} height={130} />
    }
    logoLink="https://github.com/MiguelMorales1125/Project-proof"
    projectLink="https://github.com/MiguelMorales1125/Project-proof"
  />
);

const footer = (
  <Footer>MIT {new Date().getFullYear()} © IPSMultisalud.</Footer>
);

const search = <Search placeholder="Buscar documentación" />;

const HIDDEN_FROM_DOCS = new Set(["progreso"]);

function withoutInternalPages(pageMap: PageMapItem[]): PageMapItem[] {
  return pageMap.flatMap((item) => {
    if ("data" in item && item.data) {
      const data = { ...item.data };
      for (const name of HIDDEN_FROM_DOCS) {
        delete data[name];
      }
      return [{ ...item, data }];
    }

    if ("name" in item && HIDDEN_FROM_DOCS.has(item.name)) {
      return [];
    }

    if ("children" in item && Array.isArray(item.children)) {
      return [
        {
          ...item,
          children: withoutInternalPages(item.children),
        },
      ];
    }

    return [item];
  });
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = withoutInternalPages(
    (await getPageMap()) as PageMapItem[],
  );

  return (
    <html lang="es" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/MiguelMorales1125/Project-proof"
          footer={footer}
          search={search}
          editLink={null}
          feedback={{ content: null }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
