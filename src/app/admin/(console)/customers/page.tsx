import { getRepo } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { CustomerList } from "@/components/admin/customer-list";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const customers = await getRepo().listCustomers();
  const repeat = customers.filter((c) => c.order_count > 1).length;
  return (
    <>
      <PageTitle title="Customers" subtitle={`${customers.length} customers · ${repeat} came back more than once`} />
      <Body>
        <CustomerList customers={customers} />
      </Body>
    </>
  );
}
