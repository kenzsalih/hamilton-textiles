import Link from "next/link";
import { Plus } from "lucide-react";
import { getRepo } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { MaterialList } from "@/components/admin/material-list";

export const metadata = { title: "Fabrics" };

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const repo = getRepo();
  const [{ filter }, materials, categories] = await Promise.all([searchParams, repo.listMaterials({ includeHidden: true }), repo.listCategories()]);
  const totalMetres = materials.reduce((s, m) => s + m.stock_m, 0);

  return (
    <>
      <PageTitle
        title="Fabrics"
        subtitle={`${materials.length} fabrics · ${Math.round(totalMetres).toLocaleString("en")} m in stock`}
        action={
          <Link href="/admin/materials/new" className="btn btn-primary h-10 px-4 text-xs">
            <Plus className="size-4" />
            Add
          </Link>
        }
      />
      <Body>
        <MaterialList
          materials={materials}
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
          initialFilter={filter === "low" || filter === "hidden" ? filter : "all"}
        />
      </Body>
    </>
  );
}
