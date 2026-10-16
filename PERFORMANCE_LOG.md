# NEP-CLOTH Performance Work Log

## Safety and baseline

- Before edits, copied `Frontend/src`, `Frontend/public`, `Backend/src`, and `Backend/prisma` to `D:\_backup_before_perf`; excluded `.env` and `node_modules`. Original image files were not modified.
- Baseline was a Vite production build served by `vite preview`; Lighthouse used mobile emulation, 150 ms RTT, 1.6 Mbps throughput, and 4x CPU slowdown. JSON captures are in `D:\_backup_before_perf`.
- Baseline storefront entry JavaScript: 1,203.91 KB raw / 342.43 KB gzip. `Frontend/public` contained 93 image files totaling 21.87 MB.

| Route | Perf | A11y | BP | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 56 | 96 | 96 | 10.3 s | 19.9 s | 0 ms | 0.006 |
| `/men` | 42 | 98 | 96 | 5.4 s | 11.7 s | 680 ms | 0.007 |
| `/women` | 56 | 98 | 96 | 10.2 s | 17.0 s | 0 ms | 0.008 |
| `/product/ald-cap-ald` | 67 | 98 | 96 | 4.3 s | 4.6 s | 250 ms | 0.017 |

The baseline product URL did not resolve to the same populated product as the final test URL, so product-route A11y/performance are not a strict same-content comparison.

## Findings

- Route pages each mounted their own shared navbar/cursor; storefront product requests were initiated by multiple independent loaders, including the navbar and home sections. This caused redundant requests and layout/auth state churn.
- The storefront bundle eagerly included all routes and admin/chart code. External font stylesheets delayed rendering; many full-size source images were requested without responsive variants or reserved dimensions.
- Anonymous catalog GETs constructed Supabase auth headers, causing unnecessary session work. `/auth/me` called Supabase `getUser` and upserted the profile on every request.
- Product list executed count, products+variants, and review aggregation queries; detail used a product query and review aggregate. These reads traverse a one-connection Prisma pooler to Supabase Seoul.
- Local `GET /health` works without the database; database availability is the local/prod API bottleneck, not the Vite proxy. No credentials or environment values were printed.

## Changes

- `Frontend/src/App.jsx`: persistent storefront layout, route-level lazy loading, admin-only route chunks, React Query defaults, and one semantic main landmark.
- `Frontend/src/hooks/useProducts.js`, `Frontend/src/lib/api.js`, storefront pages, home sections, `Navbar.jsx`, cart/orders/product pages: shared query cache and request de-duplication; abortable public product reads; deferred product reviews/recommendations until near viewport; product detail prefetch on catalog-link hover/focus. The navbar loads gender products only when its menu opens.
- `Frontend/src/components/ResponsiveImage.jsx`, `Frontend/src/data/optimized-images.json`, and `Frontend/scripts/optimize-images.mjs`: repeatable Sharp image pipeline and shared `srcset` component. Generated 258 WebP/AVIF variants for 90 source images under `Frontend/public/optimized`; source assets remain unchanged. Largest 480px derivative is 81.6 KB. Hero mobile variants are below 13 KB.
- `Frontend/src/main.jsx`, `ScrollHero.jsx`, `MenHero.jsx`, `WomenHero.jsx`, and hero styles: responsive variants/preloads use the same source photos and preserve dimensions. The home wordmark uses `--hero-wordmark-scale: 0.9`. Existing protected GSAP timelines, animation hooks, timing, and source image files were not edited. Exact before/after animation-timing comparison was not available; the 1920px final composition was visually inspected.
- `Frontend/index.html`, `Frontend/public/fonts/`, `Frontend/public/site.webmanifest`, and `Frontend/src/styles/globals.css`: self-hosted WOFF2 fonts, critical font preloads, responsive layout/touch/reduced-motion styles, reserved image space, theme color, and manifest. No service worker was added.
- `Frontend/src/components/CursorFollower.jsx`: no cursor on coarse pointers, transform quick-to animation, and pause while the document is hidden.
- `Backend/src/lib/publicProductCache.ts`, `Backend/src/routes/products.ts`, `Backend/src/app.ts`: 60-second process-local cache for public product list/detail responses, same-key in-flight request coalescing, successful-write invalidation, `public, max-age=15, stale-while-revalidate=60` only for public catalog routes, private/no-store by default, gzip compression, ETags (Express default), and safe `Server-Timing`/route duration logs. Checkout still reads current server-side stock and prices.
- `Backend/src/middleware/auth.ts`: Supabase `getClaims` signature/issuer/audience/expiry validation, 60-second in-memory profile cache, create-only-if-missing profile behavior, and a fresh database role check for every admin request. No auth/authorization rules were relaxed.
- `Backend/src/lib/storage.ts`, Backend package files: validated uploads are resized/rotated and converted to WebP at max 1600px / quality 85 before upload. Existing type/magic-byte/size validation remains in the route. `Backend/src/index.ts` attempts a startup DB connection but keeps HTTP health available if it is temporarily refused.
- Product-list Prisma queries are sequential because the configured Prisma pool has `connection_limit=1`; running count and list concurrently caused real pool acquisition timeouts under concurrent cold requests. Same-key API misses now share one loader. No Prisma schema or data migration was applied: `EXPLAIN ANALYZE` showed a sub-0.1 ms product scan on the current small catalog with no index selected, while network/pool latency dominated. `prisma migrate status` against the transaction pooler did not complete, so no unverified migration was run.

## After measurements

Production-build Lighthouse final captures: `D:\_backup_before_perf\lighthouse-{home,men,women,product}-final.json`.

| Route | Perf | A11y | BP | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 87 | 96 | 100 | 2.3 s | 3.5 s | 100 ms | 0 |
| `/men` | 79 | 100 | 100 | 2.2 s | 4.6 s | 40 ms | 0 |
| `/women` | 83 | 100 | 100 | 2.2 s | 3.9 s | 90 ms | 0 |
| `/product/y2k-bags-bag-y2k-bags` | 86 | 94 | 100 | 2.2 s | 3.4 s | 50 ms | 0 |

- Performance improved by +31 home, +37 men, +27 women, and +19 product points (product route content differs from the baseline). TBT and CLS targets pass; LCP and performance targets still fail on all routes except the score target on home/product.
- Initial storefront JavaScript fell to 670.73 KB raw / 199.31 KB gzip (-41.8% gzip); the storefront entry is below the 250 KB gzip target. Admin dashboard is a separate 105.44 KB gzip chunk and is not imported in the storefront entry. Vite still warns that the 670 KB uncompressed entry chunk exceeds its 500 KB warning threshold.
- Lighthouse image transfer: home 2,068 KB -> 217 KB; men 1,442 KB -> 165 KB; women 1,347 KB -> 116 KB. Product baseline had no image requests for its invalid/unpopulated route; final product page transferred 81 KB of images. All observed mobile image requests were below 200 KB; hero images were below 150 KB.
- Warm-cache read-only endpoint series (30 sequential requests each): `/products` median 10 ms / p95 18 ms; men list 7 / 8 ms; product detail 3 / 5 ms. No non-200 responses.
- Uncached read-only endpoint series (30 distinct page keys and 30 distinct real product slugs): product list app time median 4,074 ms / p95 8,161 ms (max 9,335); detail median 3,031 ms / p95 11,773 ms (max 14,739). These miss the 150 ms and 100 ms targets by a wide margin.
- Direct `SELECT 1` round trip (30 calls): median 132 ms, p95 280.5 ms. The configured pooler host is `aws-0-ap-northeast-2` (Seoul). Kathmandu-to-Seoul distance plus transaction-pooler latency is a material floor; the observed Prisma query time is much higher than the trivial SQL RTT. Moving the database closer (e.g. Mumbai) requires a hosting/account change and was not performed.
- Query counts by source inspection: product list 3 (count, product+variants, review aggregate); product detail 2; `/auth/me` 0 on profile-cache hit, 1 on existing-profile miss (profile creation can require another write); admin dashboard 6 queries launched in parallel. A valid-user auth timing and admin/order-write timings were not measured because no user/admin credentials were supplied and order/admin writes would affect real data.
- Playwright smoke test: home, men, women, and a populated product page at 360x640, 390x844, 412x915, and 768x1024: no horizontal overflow, failed images, missing main landmark, page errors, or console errors. Home production-preview request check: one `/api/products?page=1&limit=50` call. Local `/api/health` returned `{"ok":true}`; API catalog/detail returned 200. No checkout/order/review/admin mutation flows were submitted.
- `npm run build` succeeds in Frontend and Backend, including `prisma generate && tsc`; `npm run lint` exits successfully with existing warnings, including untouched protected GSAP-hook dependency warnings. `npm audit` reported three high-severity Prisma dependency advisories; no forced dependency upgrades were applied.

## Unresolved / follow-up required

- The 85+ Lighthouse goal and LCP <=2.5 s remain unmet for men/women and LCP remains above target on every route. The blocking cause is uncached remote DB/pooler reads; the selected Seoul region is not close enough to Nepal for the requested endpoint timings. Public caching makes repeat traffic fast but cannot eliminate first-hit latency, and process-local cache invalidation cannot coordinate separate serverless instances.
- Reviews and several admin data lists still use their existing fetch/state flows rather than a complete React Query migration. Full authenticated customer/admin regression flows, image upload verification, and actual Vercel deployment were not run; there was no safe isolated test database/account in this workspace.
- Product Lighthouse A11y is 94 versus the baseline report's 98, but the baseline URL did not contain the same populated product. Existing contrast/heading issues remain; visual changes outside the authorized wordmark exception were avoided.
- `prisma migrate status` hung against the configured transaction pooler; no schema change was applied. To migrate indexes in the future, verify/use a direct PostgreSQL migration URL first and capture an after-plan.
