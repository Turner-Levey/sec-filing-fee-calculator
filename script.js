(function () {
  "use strict";

  const RATE = 0.00013810;
  const RATE_LABEL = "$138.10 per $1,000,000";
  const form = document.querySelector("#fee-form");
  const fields = {
    aggregate: document.querySelector("#aggregate"),
    shares: document.querySelector("#shares"),
    price: document.querySelector("#price"),
    offset: document.querySelector("#offset"),
    fee: document.querySelector("#fee"),
    netFee: document.querySelector("#net-fee")
  };

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function parseMoney(value) {
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  function currentMode() {
    return new FormData(form).get("mode") || "aggregate";
  }

  function calculate() {
    const mode = currentMode();
    document.body.dataset.mode = mode;
    const aggregate = mode === "shares"
      ? parseMoney(fields.shares.value) * parseMoney(fields.price.value)
      : parseMoney(fields.aggregate.value);
    const offset = parseMoney(fields.offset.value);
    const fee = aggregate * RATE;
    const netFee = Math.max(fee - offset, 0);
    fields.fee.textContent = currency.format(fee);
    fields.netFee.textContent = currency.format(netFee);
    return { mode, aggregate, offset, fee, netFee };
  }

  function memo() {
    const result = calculate();
    return [
      "SEC filing fee estimate",
      `Aggregate amount: ${currency.format(result.aggregate)}`,
      `Rate used: ${RATE_LABEL} (${RATE.toFixed(8)})`,
      `Calculated filing fee: ${currency.format(result.fee)}`,
      `Previously paid fee offset: ${currency.format(result.offset)}`,
      `Net fee estimate: ${currency.format(result.netFee)}`,
      "Source: https://www.sec.gov/about/feeamt",
      "Check EDGAR, FEPT, and the applicable filing instructions before submitting."
    ].join("\n");
  }

  function row() {
    const result = calculate();
    return [
      "aggregate_amount,fee_rate,calculated_fee,offset,net_fee,source",
      [
        result.aggregate.toFixed(2),
        RATE.toFixed(8),
        result.fee.toFixed(2),
        result.offset.toFixed(2),
        result.netFee.toFixed(2),
        "https://www.sec.gov/about/feeamt"
      ].join(",")
    ].join("\n");
  }

  async function copyText(text, button) {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  document.querySelector("#copy-memo").addEventListener("click", (event) => {
    copyText(memo(), event.currentTarget).catch(() => {});
  });
  document.querySelector("#copy-row").addEventListener("click", (event) => {
    copyText(row(), event.currentTarget).catch(() => {});
  });
  document.querySelector("#download-csv").addEventListener("click", () => {
    const blob = new Blob([row()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sec-filing-fee-estimate.csv";
    link.click();
    URL.revokeObjectURL(url);
  });

  calculate();
}());
