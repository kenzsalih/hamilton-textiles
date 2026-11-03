import { getRepo } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { MaterialForm } from "@/components/admin/material-form";

export const metadata = { title: "Add fabric" };

export default async function NewMaterialPage() {
  const categories = await getRepo().listCategories();
  return (
    <>
      <PageTitle title="Add fabric" back="/admin/materials" />
      <Body>
        <MaterialForm categories={categories.map((c) => ({ id: c.id, name: c.name_en }))} />
      </Body>
    </>
  );
}
