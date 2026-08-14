export default async function ClientePublicoPage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;
  return <div>Cliente público {token}</div>;
}
