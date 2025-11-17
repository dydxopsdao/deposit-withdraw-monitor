export class MetamaskNetworkFeeAlertError extends Error {
  constructor(message: string = "MetaMask network fee alert triggered") {
    super(message);
    this.name = "MetamaskNetworkFeeAlertError";
  }
}

