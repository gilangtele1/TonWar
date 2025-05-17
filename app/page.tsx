"use client";

import { useEffect, useRef, useState } from "react";
import { Address } from "@ton/core";
import { TonConnectUI } from "@tonconnect/ui";
import { beginCell } from "@ton/ton";

interface Testimonial {
  name: string;
  message: string;
  utime: number;
}

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const tonConnectUIRef = useRef<TonConnectUI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(
        "https://tonapi.io/v2/blockchain/accounts/UQDYwb2h6aeCti27KZyLbS5cccpH5RM1pBB3omRkPUJRqFBy/transactions"
      );
      const json = await res.json();

      const results: Testimonial[] = [];

      for (const tx of json.transactions) {
        const raw = tx.in_msg?.source?.address;
        const text = tx.in_msg?.decoded_body?.text;
        const utime = tx.utime;

        if (raw && text && utime) {
          try {
            const name = Address.parse(raw).toString({ bounceable: false });
            results.push({ name, message: text, utime });
          } catch {}
        }
      }

      setTestimonials(results);
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!tonConnectUIRef.current) {
      const tonConnect = new TonConnectUI({
        manifestUrl: "https://ton-war-xi.vercel.app/tonconnect-manifest.json",
        buttonRootId: "ton-connect",
      });
      tonConnectUIRef.current = tonConnect;

      tonConnect.onStatusChange((wallet) => {
        if (wallet?.account?.address) {
          setUserAddress(
            Address.parse(wallet.account.address).toString({
              bounceable: false,
            })
          );
        } else {
          setUserAddress(null);
        }
      });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [testimonials]);

  const sendTransaction = async () => {
    if (!tonConnectUIRef.current) return;

    const body = beginCell()
      .storeUint(0, 32)
      .storeStringTail(inputMessage)
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [
        {
          address: "UQDYwb2h6aeCti27KZyLbS5cccpH5RM1pBB3omRkPUJRqFBy",
          amount: "20000000",
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUIRef.current.sendTransaction(transaction);
      setInputMessage("");
      setTimeout(() => {
        fetchTransactions();
      }, 2 * 60 * 1000);
    } catch (error) {
      console.error("Gagal kirim transaksi:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="w-full bg-white shadow-md px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold sm:text-2xl">TON WAR</span>
        </div>
        <div id="ton-connect" />
      </nav>

      {/* Chat area */}
      <div className="flex flex-col flex-1 w-full px-2 sm:px-4 max-w-full sm:max-w-6xl mx-auto min-h-0">
        <section
          className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {testimonials.length === 0 ? (
            <p className="text-center text-gray-500 italic mt-10">
              Belum ada pesan yang masuk.
            </p>
          ) : (
            [...testimonials].reverse().map((t, i) => {
              const isSelf = t.name === userAddress;
              return (
                <div
                  key={i}
                  className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`p-3 sm:p-4 rounded-xl border shadow-xl inline-block max-w-xs sm:max-w-sm ${
                      isSelf
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-gray-900 rounded-tl-none"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {new Date(t.utime * 1000).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    {!isSelf && (
                      <div className="text-xs text-blue-600 truncate mb-1">
                        Dari: {t.name}
                      </div>
                    )}
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {t.message}
                    </div>
                  </article>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Input */}
        <footer className="py-3 border-t border-gray-200 bg-white flex gap-2 px-2 sm:px-4">
          <input
            type="text"
            className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300 text-sm"
            placeholder="Tulis pesan..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button
            onClick={sendTransaction}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base disabled:opacity-50"
          >
            Kirim
          </button>
        </footer>
      </div>
    </div>
  );
}
