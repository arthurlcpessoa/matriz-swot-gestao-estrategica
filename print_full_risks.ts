import { createClient } from "@supabase/supabase-js";

const url = "https://dcaazjqckvfqmgdapooj.supabase.co";
const key = "sb_publishable_OR5xjC4W7XAwAHQA8dk8kw_5pBrSIhz";

const supabase = createClient(url, key);

async function run() {
  const { data: swotItems } = await supabase.from("swot_items").select("*");

  const res = await fetch("http://localhost:3000/api/analyze-swot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: swotItems })
  });

  const data: any = await res.json();
  console.log("=== JSON STRINGIFY SHORT ===");
  console.log(JSON.stringify(data.risks, null, 2));
}

run();
