let database = {
  url: "",
};

function isArray(child) {
  return Array.isArray(child);
}

let $ = new Proxy(
  {},
  {
    get(_, key) {
      return (args, child = [""]) => {
        return `<${key} ${Object.keys(args)
          .map((key) => `${key}="${args[key]}"`)
          .join(" ")}>${isArray(child) ? child.join("") : child}</${key}>`;
      };
    },
  }
);

const urlInput = document.getElementById("url");
const createButton = document.getElementById("create");

urlInput.addEventListener("input", (event) => {
  database.url = event.target.value;
  console.log("URL: " + database.url);
});

createButton.addEventListener("click", async () => {
  const res = await fetch("/{{path}}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(database),
  });

  const data = await res.json();
  const url = location.origin + "/" + data.id;

  if (res.status === 200) {
    document.getElementById("result").innerHTML = $.div(
      {
        class: "mt-6 p-4 bg-green-100 border border-green-400 text-green-700",
      },
      [
        $.p({}, "短縮成功"),
        $.a({ href: url }, url),
        $.p({}, `対象url: ${data.url}`),
      ]
    );
  } else {
    document.getElementById("result").innerHTML = $.div(
      {
        class: "mt-6 p-4 bg-red-100 border border-red-400 text-red-700",
      },
      $.p("短縮失敗")
    );
  }
});
