document.addEventListener('DOMContentLoaded', () => {
  const BACKEND_URL = "http://127.0.0.1:5000"; // Adjust if needed

  // Elements
  const fromAmountInput = document.getElementById('from-amount-input');
  const fromCurrencyButton = document.getElementById('from-currency-select-button');
  const fromCurrencyDropdown = document.getElementById('from-currency-dropdown');
  const toAmountDisplay = document.getElementById('to-amount-display');
  const exchangeButton = document.getElementById('exchange-button');
  const depositInfo = document.getElementById('deposit-info');
  const depositAddressDisplay = document.getElementById('deposit-address-display');
  const statusDisplay = document.getElementById('status-display');
  const qrcodeContainer = document.getElementById('qrcode');

  let selectedCurrency = null;

  const networkColors = {
     "BITCOIN": "#F7931A",        // Bitcoin
  "ETH": "#3C3C3D",            // Ethereum
  "BSC": "#F0B90B",            // Binance Smart Chain
  "TRX": "#EC0623",            // TRON
  "EOS": "#000000",            // EOS
  "SOL": "#9932CC",            // Solana
  "XRP": "#346AA9",            // Ripple (XRP Ledger)
  "LTC": "#BFBBBB",            // Litecoin
  "ADA": "#0033AD",            // Cardano
  "DOT": "#E6007A",            // Polkadot
  "AVAX": "#E84142",           // Avalanche
  "MATIC": "#8247E5",          // Polygon
  "FTM": "#1969FF",            // Fantom
  "XMR": "#FF6600",            // Monero
  "ARB": "#28A0F0",            // Arbitrum
  "OP": "#FF0420",             // Optimism
  "CRO": "#002D74",            // Cronos
  "ATOM": "#2E3148",           // Cosmos
  "XTZ": "#0E75C9",            // Tezos
  "ALGO": "#000000",           // Algorand
  "ZIL": "#49C1BF",            // Zilliqa
  "NEAR": "#000000",           // NEAR Protocol
  "BNB": "#F3BA2F",            // Binance Chain
  "DOGE": "#C2A633",           // Dogecoin
  "VET": "#15BDFF",            // VeChain
  "ETC": "#34FA99",            // Ethereum Classic
  "DASH": "#008CE7",           // Dash
  "ZEC": "#F4B728",            // Zcash
  "FIL": "#0090FF",            // Filecoin
  "XLM": "#08B5E5",            // Stellar
  "HBAR": "#3A3A3A",           // Hedera Hashgraph
  "KSM": "#000000",            // Kusama
  "FLOW": "#28D9A3",           // Flow
  "ICP": "#29ABE2",            // Internet Computer
  "ONE": "#00AEEF",            // Harmony
  "QTUM": "#2C9CED",           // Qtum
  "KAVA": "#FF2D55",           // Kava
  "XDC": "#F49800",            // XDC Network
  "WAVES": "#0055FF",          // Waves
  "BTG": "#EBA809",            // Bitcoin Gold
  "BCH": "#8DC351"             // Bitcoin Cash
  };

  let aggregatorCryptos = [];
  let coingeckoMap = {};

  // Fetch aggregator currencies
  fetch(`${BACKEND_URL}/api/all_cryptos`)
    .then(res => res.json())
    .then(cryptos => {
      aggregatorCryptos = cryptos; 
      // Now fetch coingecko cryptos to build fallback image map
      return fetch(`${BACKEND_URL}/api/cryptos`);
    })
    .then(res => res.json())
    .then(geckoData => {
      // geckoData: array of {ticker, name, logo} from coingecko
      // Create a map: UPPERCASE ticker -> logo
      geckoData.forEach(g => {
        const ticker = g.ticker.toUpperCase();
        coingeckoMap[ticker] = g.logo; 
      });

      // Now build the dropdown with aggregator data
      fromCurrencyDropdown.innerHTML = '';
      aggregatorCryptos.forEach(coin => {
        // coin: {symbol, name, network, image}
        const itemEl = document.createElement('div');
        itemEl.classList.add('dropdown-item');
        itemEl.style.display = 'flex';
        itemEl.style.alignItems = 'center';

        let imgSrc = coin.image;
        if (!imgSrc || imgSrc.trim() === '') {
          // Try coingecko fallback
          const fallbackLogo = coingeckoMap[coin.symbol]; 
          if (fallbackLogo) {
            imgSrc = fallbackLogo;
          } else {
            // If no fallback found, use a placeholder image (data URL or a known placeholder)
            imgSrc = 'https://via.placeholder.com/24'; 
          }
        }

        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.alt = `${coin.symbol} logo`;
        imgEl.style.width = '24px';
        imgEl.style.height = '24px';
        imgEl.style.marginRight = '8px';

        const infoDiv = document.createElement('div');
        infoDiv.style.display = 'flex';
        infoDiv.style.flexDirection = 'column';

        const symbolSpan = document.createElement('span');
        symbolSpan.style.fontWeight = 'bold';
        symbolSpan.style.fontSize = '14px';
        symbolSpan.textContent = coin.symbol;

        const networkDiv = document.createElement('div');
        networkDiv.style.fontSize = '12px';
        networkDiv.style.color = '#fff';
        networkDiv.style.padding = '2px 4px';
        networkDiv.style.borderRadius = '4px';
        networkDiv.style.marginTop = '2px';
        networkDiv.style.display = 'inline-block';

        const netKey = (coin.network || coin.symbol).toUpperCase();
        networkDiv.style.backgroundColor = networkColors[netKey] || '#444';
        networkDiv.textContent = coin.network ? coin.network.toUpperCase() : coin.symbol;

        infoDiv.appendChild(symbolSpan);
        infoDiv.appendChild(networkDiv);

        itemEl.appendChild(imgEl);
        itemEl.appendChild(infoDiv);

        itemEl.addEventListener('click', () => {
          selectedCurrency = coin.symbol;
          fromCurrencyButton.textContent = coin.symbol;
          fromCurrencyDropdown.style.display = 'none';
          updateAmounts();
        });
        fromCurrencyDropdown.appendChild(itemEl);
      });
    })
    .catch(err => console.error("Error fetching cryptos:", err));

  // Show/hide currency dropdown
  fromCurrencyButton.addEventListener('click', () => {
    fromCurrencyDropdown.style.display = fromCurrencyDropdown.style.display === 'block' ? 'none' : 'block';
  });

  fromAmountInput.addEventListener('input', updateAmounts);

  function updateAmounts() {
    const fromAmount = parseFloat(fromAmountInput.value);
    if (!fromAmount || !selectedCurrency) {
      toAmountDisplay.textContent = "--";
      return;
    }

    fetch(`${BACKEND_URL}/api/exchange-estimate?from_currency=${selectedCurrency}&from_amount=${fromAmount}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toAmountDisplay.textContent = `Error: ${data.error}`;
          return;
        }
        toAmountDisplay.textContent = `≈ ${data.to_amount.toFixed(6)} XMR`;
      })
      .catch(err => {
        console.error("Error fetching estimate:", err);
        toAmountDisplay.textContent = "Error fetching estimate.";
      });
  }

  exchangeButton.addEventListener('click', () => {
    const fromAmount = parseFloat(fromAmountInput.value);
    if (!fromAmount || !selectedCurrency) {
      alert("Please enter an amount and select a currency first.");
      return;
    }

    const xmrAddress = prompt("Enter the recipient's XMR address:");
    if (!xmrAddress) {
      alert("XMR address is required.");
      return;
    }

    const refundAddress = prompt(`Enter refund address for ${selectedCurrency}:`) || "";

    const payload = {
      from_currency: selectedCurrency,
      from_amount: fromAmount,
      address_to: xmrAddress,
      user_refund_address: refundAddress
    };

    fetch(`${BACKEND_URL}/api/create-exchange`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error creating exchange: " + data.error);
        return;
      }

      depositAddressDisplay.textContent = `Deposit this amount to: ${data.deposit_address}`;
      depositInfo.style.display = 'block';

      qrcodeContainer.innerHTML = "";
      new QRCode(qrcodeContainer, {
        text: data.deposit_address,
        width:128,
        height:128
      });

      pollTransactionStatus(data.transactionId);
    })
    .catch(err => {
      console.error("Error creating exchange:", err);
      alert("Failed to create exchange.");
    });
  });

  function pollTransactionStatus(txId) {
    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/api/status/${txId}`)
        .then(res => res.json())
        .then(statusData => {
          if (statusData.error) {
            statusDisplay.textContent = `Error: ${statusData.error}`;
            clearInterval(interval);
            return;
          }

          statusDisplay.textContent = `Status: ${statusData.status}`;
          if (statusData.status === 'finished' || statusData.status === 'failed') {
            clearInterval(interval);
          }
        })
        .catch(err => {
          console.error("Error polling status:", err);
          clearInterval(interval);
        });
    }, 5000);
  }

});
