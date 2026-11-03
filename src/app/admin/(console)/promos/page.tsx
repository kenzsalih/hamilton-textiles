import { getRepo } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { PromoManager } from "@/components/admin/promo-manager";

export const metadata = { title: "Promo codes" };

export default async function PromosPage() {
  const promos = await getRepo().listPromos();
  return (
    <>
      <PageTitle title="Promo codes" subtitle="Discounts customers enter at checkout" back="/admin/more" />
      <Body>
        <PromoManager promos={promos} />
      </Body>
    </>
  );
}
