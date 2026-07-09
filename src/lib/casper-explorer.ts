// Back-compat re-export. The network config is the single source of truth now;
// pass the row's network so mainnet links go to cspr.live, testnet to testnet.cspr.live.
export { casperExplorerUrl, truncateHash } from "@/lib/casper-networks";
