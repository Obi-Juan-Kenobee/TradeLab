// Configuration for Futures contracts tick sizes and values
const futuresConfig = {
    // === EQUITY INDEX FUTURES ===
    // E-mini S&P 500
    'ES': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'E-mini S&P 500',
        exchange: 'CME',
        category: 'Equity Index'
    },
    // Micro E-mini S&P 500
    'MES': {
        tickSize: 0.25,
        tickValue: 1.25,
        ticksPerPoint: 4,
        description: 'Micro E-mini S&P 500',
        exchange: 'CME',
        category: 'Equity Index'
    },
    // E-mini Nasdaq 100
    'NQ': {
        tickSize: 0.25,
        tickValue: 5.00,
        ticksPerPoint: 4,
        description: 'E-mini Nasdaq 100',
        exchange: 'CME',
        category: 'Equity Index'
    },
    // Micro E-mini Nasdaq 100
    'MNQ': {
        tickSize: 0.25,
        tickValue: 0.50,
        ticksPerPoint: 4,
        description: 'Micro E-mini Nasdaq 100',
        exchange: 'CME',
        category: 'Equity Index'
    },
    // E-mini Russell 2000
    'RTY': {
        tickSize: 0.10,
        tickValue: 10.00,
        ticksPerPoint: 10,
        description: 'E-mini Russell 2000',
        exchange: 'CME',
        category: 'Equity Index'
    },
    // Micro E-mini Russell 2000
    'M2K': {
        tickSize: 0.10,
        tickValue: 1.00,
        ticksPerPoint: 10,
        description: 'Micro E-mini Russell 2000',
        exchange: 'CME',
        category: 'Equity Index'
    },
    'YM': {
        tickSize: 1.00,
        tickValue: 5.00,
        ticksPerPoint: 1,
        description: 'E-mini Dow',
        exchange: 'CBOT',
        category: 'Equity Index'
    },
    'MYM': {
        tickSize: 1.00,
        tickValue: 0.50,
        ticksPerPoint: 1,
        description: 'Micro E-mini Dow',
        exchange: 'CBOT',
        category: 'Equity Index'
    },
  
    // === FIXED INCOME FUTURES ===
    'ZB': {
        tickSize: 0.03125,
        tickValue: 31.25,
        ticksPerPoint: 32,
        description: '30-Year U.S. Treasury Bond',
        exchange: 'CBOT',
        category: 'Fixed Income'
    },
    'ZN': {
        tickSize: 0.015625,
        tickValue: 15.625,
        ticksPerPoint: 64,
        description: '10-Year U.S. Treasury Note',
        exchange: 'CBOT',
        category: 'Fixed Income'
    },
    'ZF': {
        tickSize: 0.0078125,
        tickValue: 7.8125,
        ticksPerPoint: 128,
        description: '5-Year U.S. Treasury Note',
        exchange: 'CBOT',
        category: 'Fixed Income'
    },
    'ZT': {
        tickSize: 0.00390625,
        tickValue: 3.90625,
        ticksPerPoint: 256,
        description: '2-Year U.S. Treasury Note',
        exchange: 'CBOT',
        category: 'Fixed Income'
    },
  
    // === CURRENCY FUTURES ===
    '6E': {
        tickSize: 0.0001,
        tickValue: 12.50,
        ticksPerPoint: 10000,
        description: 'Euro FX',
        exchange: 'CME',
        category: 'Currency'
    },
    'M6E': {
        tickSize: 0.0001,
        tickValue: 1.25,
        ticksPerPoint: 10000,
        description: 'Micro Euro FX',
        exchange: 'CME',
        category: 'Currency'
    },
    '6B': {
        tickSize: 0.0001,
        tickValue: 6.25,
        ticksPerPoint: 10000,
        description: 'British Pound',
        exchange: 'CME',
        category: 'Currency'
    },
    '6J': {
        tickSize: 0.000001,
        tickValue: 6.25,
        ticksPerPoint: 1000000,
        description: 'Japanese Yen',
        exchange: 'CME',
        category: 'Currency'
    },
    '6C': {
        tickSize: 0.0001,
        tickValue: 10.00,
        ticksPerPoint: 10000,
        description: 'Canadian Dollar',
        exchange: 'CME',
        category: 'Currency'
    },
    '6A': {
        tickSize: 0.0001,
        tickValue: 10.00,
        ticksPerPoint: 10000,
        description: 'Australian Dollar',
        exchange: 'CME',
        category: 'Currency'
    },
  
    // === ENERGY FUTURES ===
    'CL': {
        tickSize: 0.01,
        tickValue: 10.00,
        ticksPerPoint: 100,
        description: 'Crude Oil',
        exchange: 'NYMEX',
        category: 'Energy'
    },
    'MCL': {
        tickSize: 0.01,
        tickValue: 1.00,
        ticksPerPoint: 100,
        description: 'Micro Crude Oil',
        exchange: 'NYMEX',
        category: 'Energy'
    },
    'NG': {
        tickSize: 0.001,
        tickValue: 10.00,
        ticksPerPoint: 1000,
        description: 'Natural Gas',
        exchange: 'NYMEX',
        category: 'Energy'
    },
    'QG': {
        tickSize: 0.001,
        tickValue: 2.50,
        ticksPerPoint: 1000,
        description: 'E-mini Natural Gas',
        exchange: 'NYMEX',
        category: 'Energy'
    },
    'RB': {
        tickSize: 0.0001,
        tickValue: 4.20,
        ticksPerPoint: 10000,
        description: 'RBOB Gasoline',
        exchange: 'NYMEX',
        category: 'Energy'
    },
    'HO': {
        tickSize: 0.0001,
        tickValue: 4.20,
        ticksPerPoint: 10000,
        description: 'Heating Oil',
        exchange: 'NYMEX',
        category: 'Energy'
    },
  
    // === METALS FUTURES ===
    'GC': {
        tickSize: 0.10,
        tickValue: 10.00,
        ticksPerPoint: 10,
        description: 'Gold',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'MGC': {
        tickSize: 0.10,
        tickValue: 1.00,
        ticksPerPoint: 10,
        description: 'Micro Gold',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'SI': {
        tickSize: 0.005,
        tickValue: 25.00,
        ticksPerPoint: 200,
        description: 'Silver',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'SIL': {
        tickSize: 0.005,
        tickValue: 2.50,
        ticksPerPoint: 200,
        description: 'Micro Silver',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'HG': {
        tickSize: 0.0005,
        tickValue: 12.50,
        ticksPerPoint: 2000,
        description: 'Copper',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'MHG': {
        tickSize: 0.0005,
        tickValue: 1.25,
        ticksPerPoint: 2000,
        description: 'Micro Copper',
        exchange: 'COMEX',
        category: 'Metals'
    },
    'PA': {
        tickSize: 0.10,
        tickValue: 5.00,
        ticksPerPoint: 10,
        description: 'Palladium',
        exchange: 'NYMEX',
        category: 'Metals'
    },
    'PL': {
        tickSize: 0.10,
        tickValue: 5.00,
        ticksPerPoint: 10,
        description: 'Platinum',
        exchange: 'NYMEX',
        category: 'Metals'
    },
  
    // === AGRICULTURAL FUTURES ===
    'ZC': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'Corn',
        exchange: 'CBOT',
        category: 'Agriculture'
    },
    'ZW': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'Wheat',
        exchange: 'CBOT',
        category: 'Agriculture'
    },
    'ZS': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'Soybeans',
        exchange: 'CBOT',
        category: 'Agriculture'
    },
    'KE': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'KC Wheat',
        exchange: 'KCBT',
        category: 'Agriculture'
    },
    'ZM': {
        tickSize: 0.10,
        tickValue: 10.00,
        ticksPerPoint: 10,
        description: 'Soybean Meal',
        exchange: 'CBOT',
        category: 'Agriculture'
    },
    'ZL': {
        tickSize: 0.0001,
        tickValue: 6.00,
        ticksPerPoint: 10000,
        description: 'Soybean Oil',
        exchange: 'CBOT',
        category: 'Agriculture'
    },
    'CT': {
        tickSize: 0.01,
        tickValue: 5.00,
        ticksPerPoint: 100,
        description: 'Cotton',
        exchange: 'ICE',
        category: 'Agriculture'
    },
    'KC': {
        tickSize: 0.05,
        tickValue: 18.75,
        ticksPerPoint: 20,
        description: 'Coffee',
        exchange: 'ICE',
        category: 'Agriculture'
    },
    'SB': {
        tickSize: 0.01,
        tickValue: 11.20,
        ticksPerPoint: 100,
        description: 'Sugar',
        exchange: 'ICE',
        category: 'Agriculture'
    },
    'CC': {
        tickSize: 1.00,
        tickValue: 10.00,
        ticksPerPoint: 1,
        description: 'Cocoa',
        exchange: 'ICE',
        category: 'Agriculture'
    },
  
    // === CRYPTOCURRENCY FUTURES ===
    'BTC': {
        tickSize: 5.00,
        tickValue: 5.00,
        ticksPerPoint: 1,
        description: 'Bitcoin',
        exchange: 'CME',
        category: 'Cryptocurrency'
    },
    'MBT': {
        tickSize: 0.50,
        tickValue: 0.50,
        ticksPerPoint: 1,
        description: 'Micro Bitcoin',
        exchange: 'CME',
        category: 'Cryptocurrency'
    },
    'ETH': {
        tickSize: 0.25,
        tickValue: 12.50,
        ticksPerPoint: 4,
        description: 'Ether',
        exchange: 'CME',
        category: 'Cryptocurrency'
    },
    'MET': {
        tickSize: 0.25,
        tickValue: 0.50,
        ticksPerPoint: 4,
        description: 'Micro Ether',
        exchange: 'CME',
        category: 'Cryptocurrency'
    }
  };
  
  // Function to get contract info
  function getContractInfo(symbol) {
    return futuresConfig[symbol.toUpperCase()] || null;
  }
  
  // Function to get all contracts by category
  function getContractsByCategory(category) {
    return Object.entries(futuresConfig)
        .filter(([_, contract]) => contract.category === category)
        .reduce((acc, [symbol, contract]) => {
            acc[symbol] = contract;
            return acc;
        }, {});
  }
  
  // Function to get all available categories
  function getCategories() {
    return [...new Set(Object.values(futuresConfig).map(contract => contract.category))];
  }
  
  // Function to get all contracts by exchange
  function getContractsByExchange(exchange) {
    return Object.entries(futuresConfig)
        .filter(([_, contract]) => contract.exchange === exchange)
        .reduce((acc, [symbol, contract]) => {
            acc[symbol] = contract;
            return acc;
        }, {});
  }