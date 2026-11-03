import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getRepo } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { MaterialForm } from "@/components/admin/material-form";
import { StockPanel } from "@/components/admin/stock-panel";
import { DangerZone } from "@/components/admin/material-danger-zone";

export const metadata = { title: "Edit fabric" };

export default async function EditMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const repo = getRepo();
  const [material, categories, movements] = await Promise.all([repo.getMaterial(id), repo.listCategories(), repo.listStockMovements(id, 15)]);
  if (!material) notFound();

  return (
    <>
      <PageTitle
        title={material.name_en}
        subtitle={`${material.sku}${material.is_active ? "" : " · Hidden from website"}`}
        back="/admin/materials"
        action={
          material.is_active && (
            <a href={`/en/fabric/${material.slug}`} target="_blank" className="grid size-10 place-items-center rounded-full border border-sand" aria-label="View on website">
              <ExternalLink className="size-4" />
            </a>
          )
        }
      />
      <Body className="space-y-4">
        {created && <p className="rounded-xl bg-pine-50 px-4 py-3 text-sm font-medium text-pine-800">Fabric added{material.is_active ? " and live on the website" : ""}.</p>}
        <StockPanel materialId={material.id} stock={material.stock_m} lowAt={material.low_stock_m} movements={movements} />
        <MaterialForm material={material} categories={categories.map((c) => ({ id: c.id, name: c.name_en }))} />
        <DangerZone materialId={material.id} name={material.name_en} />
      </Body>
    </>
  );
}
