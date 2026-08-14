export default async function ClientePage(props: PageProps<"/clientes/[id]">) {
  const { id } = await props.params;
  return <div>Cliente {id}</div>;
}
