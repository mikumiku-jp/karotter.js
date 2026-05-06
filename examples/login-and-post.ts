import { karotter } from "../src/index.js";

const USERNAME = "username";
const PASSWORD = "password";

async function main(): Promise<void> {
  const kt = await karotter.login({
    id: USERNAME,
    password: PASSWORD,
  });

  console.log(`Logged in as @${kt.user?.username ?? "unknown"}`);

  const post = await kt.post("Hello World!", {
    visibility: "followers",
  });
  console.log(`Created post #${post.id}`);

  await kt.destroy();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
