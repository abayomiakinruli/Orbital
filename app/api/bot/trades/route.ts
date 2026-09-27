import { botHandler } from "@/lib/api";
import { createTrade } from "@/lib/repo";

// POST { telegram_id | account_id, asset, side, amount, fiat_amount,
//        rate?, fiat_currency?, status? }
export async function POST(request: Request) {
  return botHandler(request, (body) => createTrade(body));
}
