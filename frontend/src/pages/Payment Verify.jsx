import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = sessionStorage.getItem("token");
  const username       = sessionStorage.getItem("username");

  const [status,  setStatus]  = useState("verifying");
  const [orderId, setOrderId] = useState(null);
  const [txnId,   setTxnId]   = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const pidx         = searchParams.get("pidx");
    const khaltiStatus = searchParams.get("status");
    const purchaseOrderId = searchParams.get("purchase_order_id") || sessionStorage.getItem("khalti_order_id");

    // If Khalti says not completed, fail immediately
    if (!pidx || khaltiStatus !== "Completed") {
      setStatus("failed");
      return;
    }

    // Verify with our backend
    fetch("http://localhost:5000/api/khalti/verify", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ pidx, purchase_order_id: purchaseOrderId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOrderId(data.order_id);
          setTxnId(data.transaction_id);

          // Cart is no longer cleared here as per user request to keep products in cart.
          // sessionStorage.removeItem("checkout_items"); 
          sessionStorage.removeItem("checkout_subtotal");
          sessionStorage.removeItem("checkout_shipping");
          sessionStorage.removeItem("checkout_total");
          sessionStorage.removeItem("khalti_order_id");
          sessionStorage.removeItem("pending_order");

          // localStorage.removeItem("cart"); // Preserve local cart if any

          setStatus("success");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header isLoggedIn={!!token} username={username} />

      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 20px"
      }}>
        <div style={{
          background: "var(--color-background-secondary)",
          borderRadius: 16, padding: "48px 40px",
          textAlign: "center", maxWidth: 420, width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
        }}>

          {status === "verifying" && (
            <>
              <div style={{
                width: 56, height: 56, margin: "0 auto 20px",
                border: "4px solid #eee",
                borderTop: "4px solid #5C2D8F",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
              <h2 style={{ marginBottom: 8 }}>Verifying Payment…</h2>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Please wait, do not close this page.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#e8f5e9", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 36, margin: "0 auto 20px", color: "#2e7d32"
              }}>✓</div>
              <h2 style={{ color: "#2e7d32", marginBottom: 8 }}>Payment Successful!</h2>
              <p style={{ marginBottom: 4 }}>
                Order <strong>#{orderId}</strong> confirmed.
              </p>
              {txnId && (
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
                  Transaction ID: {txnId}
                </p>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => navigate("/products")}
                  style={{
                    padding: "10px 20px", borderRadius: 8,
                    background: "#5C2D8F", color: "#fff",
                    border: "none", cursor: "pointer", fontWeight: 500
                  }}
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  style={{
                    padding: "10px 20px", borderRadius: 8,
                    background: "transparent", border: "1px solid #5C2D8F",
                    color: "#5C2D8F", cursor: "pointer", fontWeight: 500
                  }}
                >
                  View Orders
                </button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fce8e8", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 36, margin: "0 auto 20px", color: "#c62828"
              }}>✕</div>
              <h2 style={{ color: "#c62828", marginBottom: 8 }}>Payment Failed</h2>
              <p style={{ marginBottom: 24, color: "var(--color-text-secondary)" }}>
                Your payment was not completed. Your order has not been placed.
              </p>
              <button
                onClick={() => navigate("/order-confirm")}
                style={{
                  padding: "10px 24px", borderRadius: 8,
                  background: "#c62828", color: "#fff",
                  border: "none", cursor: "pointer", fontWeight: 500
                }}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </div>
  );
}

export default PaymentVerify;