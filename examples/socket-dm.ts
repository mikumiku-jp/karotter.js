import { DmEvents, karotter } from "../src/index.js";

const USERNAME = "username";
const PASSWORD = "password";

async function main(): Promise<void> {
  const kt = await karotter.login(
    {
      id: USERNAME,
      password: PASSWORD,
    },
    { connect: true },
  );

  console.log(`Connected as @${kt.user?.username ?? "unknown"}`);

  kt.on(DmEvents.NewMessage, ({ groupId, message }) => {
    console.log(`[DM #${groupId}] @${message.sender?.username}: ${message.content}`);
  });

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => resolve());
  });
  await kt.destroy();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
