import { Hono } from "https://deno.land/x/hono@v3.12.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { genNumberWithAlphabet } from "./utils/genNumberWithAlphabet.ts";
import { basicAuth } from "https://deno.land/x/hono@v3.12.0/middleware.ts";

const app = new Hono();

const env = Deno.env.toObject();

const kv = await Deno.openKv();

const parse = (body: string) => {
  return body.replace(/\{\{uuid\}\}/g, crypto.randomUUID()).replace(
    /\{\{path\}\}/g,
    env.createPath ?? "",
  )
};

if (env.password !== "") {
  app.use(`/${env.createPath ?? ""}`, basicAuth({
    username: "",
    password: env.password ?? "",
  }));
}

app.get(`/${env.createPath ?? ""}`, async (c) => {
  return c.html(parse(await Deno.readTextFile("./public/index.html")));
});

app.get(`/css`, async (c) => {
  return c.body(parse(await Deno.readTextFile("./public/styles.css")), {
    headers: {
      "Content-Type": "text/css",
    },
  });
});

app.get(`/js`, async (c) => {
  return c.body(parse(await Deno.readTextFile("./public/main.js")), {
    headers: {
      "Content-Type": "text/javascript",
    },
  });
});

app.post(`/${env.createPath ?? ""}`, async (c) => {
  const body = await c.req.json();

  if (!body.url) {
    return c.json({ error: "url is required" }, 400);
  }

  if (body.url.length > 300) {
    return c.json({ error: "url is too long" }, 400);
  }

  const id = genNumberWithAlphabet(
    isNaN(parseInt(env.pathLength ?? "5")) ? 5 : parseInt(env.pathLength),
  );

  console.log(id, body.url);

  await kv.set(["id", id], body.url);
  return c.json({ id, url: body.url });
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const value = (await kv.get(["id", id])).value as string | null;

  if (!value) {
    return c.notFound();
  }

  return c.redirect(value, 302);
});

app.notFound((c) => {
  return c.redirect(`${env.notFoundUrl ?? "/"}`, 302);
});

const { serve } = Deno;

serve({
  handler: app.fetch,
  port: 3333,
});
