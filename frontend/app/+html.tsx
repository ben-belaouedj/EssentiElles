// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Livrella — Vos essentiels, livrés automatiquement</title>
        <meta
          name="description"
          content="Livrella : la boutique d'abonnement pour l'hygiène féminine et les produits bébé. Livraison automatique à votre rythme, sans engagement."
        />
        <meta name="theme-color" content="#B5838D" />
        <meta property="og:title" content="Livrella — Vos essentiels, livrés automatiquement" />
        <meta
          property="og:description"
          content="La boutique d'abonnement pour l'hygiène féminine et les produits bébé. Livraison automatique à votre rythme, sans engagement."
        />
        <meta property="og:type" content="website" />
        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
