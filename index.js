import { NativeModules, NativeEventEmitter,Platform } from 'react-native';
import createHooks from './hooks';
import createConnectionService from './connectionService';

const { RNStripeTerminal } = NativeModules;

const {      DeviceTypeChipper2X,
  DeviceTypeWisePosE,
DeviceTypeWisePad3,
DiscoveryMethodBluetoothScan,
DiscoveryMethodBluetoothProximity,
PaymentIntentStatusRequiresPaymentMethod,
PaymentIntentStatusRequiresConfirmation,
PaymentIntentStatusRequiresCapture,
PaymentIntentStatusCanceled,
PaymentIntentStatusSucceeded,

ReaderEventCardInserted,
ReaderEventCardRemoved,

PaymentStatusNotReady,
PaymentStatusReady,
PaymentStatusWaitingForInput,
PaymentStatusProcessing,

ConnectionStatusNotConnected,
ConnectionStatusConnected,
ConnectionStatusConnecting} = RNStripeTerminal.getConstants()

class StripeTerminal {
  // Device types
  DeviceTypeChipper2X = DeviceTypeChipper2X;
  DeviceTypeWisePos3 =   DeviceTypeWisePosE;
  DeviceTypeWisePad3 = DeviceTypeWisePad3;

  // Discovery methods
  DiscoveryMethodBluetoothScan = DiscoveryMethodBluetoothScan;
  DiscoveryMethodBluetoothProximity = DiscoveryMethodBluetoothProximity;

  // Payment intent statuses
  PaymentIntentStatusRequiresPaymentMethod = PaymentIntentStatusRequiresPaymentMethod;
  PaymentIntentStatusRequiresConfirmation = PaymentIntentStatusRequiresConfirmation;
  PaymentIntentStatusRequiresCapture = PaymentIntentStatusRequiresCapture;
  PaymentIntentStatusCanceled = PaymentIntentStatusCanceled;
  PaymentIntentStatusSucceeded = PaymentIntentStatusSucceeded;

  // Reader events
  ReaderEventCardInserted = ReaderEventCardInserted;
  ReaderEventCardRemoved = ReaderEventCardRemoved;

  // Payment status
  PaymentStatusNotReady = PaymentStatusNotReady;
  PaymentStatusReady = PaymentStatusReady;
  PaymentStatusWaitingForInput = PaymentStatusWaitingForInput;
  PaymentStatusProcessing = PaymentStatusProcessing;

  // Connection status
  ConnectionStatusNotConnected = ConnectionStatusNotConnected;
  ConnectionStatusConnected = ConnectionStatusConnected;
  ConnectionStatusConnecting = ConnectionStatusConnecting;

  // Fetch connection token. Overwritten in call to initialize
  _fetchConnectionToken = () =>
    Promise.reject('You must initialize RNStripeTerminal first.');

  constructor() {
    this.listener = new NativeEventEmitter(RNStripeTerminal);

    this.listener.addListener('requestConnectionToken', () => {
      this._fetchConnectionToken()
        .then(token => {
          if (token) {
            RNStripeTerminal.setConnectionToken(token, null);
          } else {
            throw new Error('User-supplied `fetchConnectionToken` resolved successfully, but no token was returned.');
          }
        })
        .catch(err => RNStripeTerminal.setConnectionToken(null, err.message || 'Error in user-supplied `fetchConnectionToken`.'));
    });

    this._createListeners([
      'log',
      'readersDiscovered',
      'readerSoftwareUpdateProgress',
      'didRequestReaderInput',
      'didRequestReaderDisplayMessage',
      'didReportReaderEvent',
      'didReportLowBatteryWarning',
      'didChangePaymentStatus',
      'didChangeConnectionStatus',
      'didReportUnexpectedReaderDisconnect',
    ]);
  }

  _createListeners(keys) {
    keys.forEach(k => {
      this[`add${k[0].toUpperCase() + k.substring(1)}Listener`] = listener =>
        this.listener.addListener(k, listener);
      this[`remove${k[0].toUpperCase() + k.substring(1)}Listener`] = listener =>
        this.listener.removeListener(k, listener);
    });
  }

  _wrapPromiseReturn(event, call, key) {
    return new Promise((resolve, reject) => {
      const subscription = this.listener.addListener(event, data => {
        if (data && data.error) {
          reject(data);
        } else {
          resolve(key ? data[key] : data);
        }
        subscription.remove();
      });

      call();
    });
  }

  initialize({ fetchConnectionToken }) {
    this._fetchConnectionToken = fetchConnectionToken;
    return new Promise((resolve, reject)=>{
    if(Platform.OS == "android"){
      RNStripeTerminal.initialize((status)=>{
        if(status.isInitialized === true){
          resolve()
        }else{
          reject(status.error);
        }
      });
    }else{
      RNStripeTerminal.initialize();
      resolve();
    }
  });
  }

  discoverReaders(deviceType, method, simulated) {
    return this._wrapPromiseReturn('readerDiscoveryCompletion', () => {
      RNStripeTerminal.discoverReaders(deviceType, method, simulated);
    });
  }

  discoverReadersByMethod(method, simulated) {
    return this._wrapPromiseReturn('readerDiscoveryCompletion', () => {
      RNStripeTerminal.discoverReadersByMethod(method, simulated);
    });
  }

  checkForUpdate() {
    return this._wrapPromiseReturn('updateCheck', () => {
      RNStripeTerminal.checkForUpdate();
    }, 'update')
  }

  installUpdate() {
    return this._wrapPromiseReturn('updateInstall', () => {
      RNStripeTerminal.installUpdate();
    })
  }

  connectReader(serialNumber) {
    return this._wrapPromiseReturn('readerConnection', () => {
      RNStripeTerminal.connectReader(serialNumber);
    });
  }

  disconnectReader() {
    return this._wrapPromiseReturn('readerDisconnectCompletion', () => {
      RNStripeTerminal.disconnectReader();
    });
  }

  getConnectedReader() {
    return this._wrapPromiseReturn('connectedReader', () => {
      RNStripeTerminal.getConnectedReader();
    }).then(data => (data.serialNumber ? data : null));
  }

  getConnectionStatus() {
    return this._wrapPromiseReturn('connectionStatus', () => {
      RNStripeTerminal.getConnectionStatus();
    });
  }

  getPaymentStatus() {
    return this._wrapPromiseReturn('paymentStatus', () => {
      RNStripeTerminal.getPaymentStatus();
    });
  }

  getLastReaderEvent() {
    return this._wrapPromiseReturn('lastReaderEvent', () => {
      RNStripeTerminal.getLastReaderEvent();
    });
  }

  createPayment(options) {
    return this._wrapPromiseReturn(
      'paymentCreation',
      () => {
        RNStripeTerminal.createPayment(options);
      },
      'intent',
    );
  }

  createPaymentIntent(options) {
    return this._wrapPromiseReturn(
      'paymentIntentCreation',
      () => {
        RNStripeTerminal.createPaymentIntent(options);
      },
      'intent'
    );
  }

  retrievePaymentIntent(clientSecret) {
    return this._wrapPromiseReturn(
      'paymentIntentRetrieval',
      () => {
        RNStripeTerminal.retrievePaymentIntent(clientSecret);
      },
      'intent'
    );
  }

  collectPaymentMethod() {
    return this._wrapPromiseReturn(
      'paymentMethodCollection',
      () => {
        RNStripeTerminal.collectPaymentMethod();
      },
      'intent'
    );
  }

  processPayment() {
    return this._wrapPromiseReturn(
      'paymentProcess',
      () => {
        RNStripeTerminal.processPayment();
      },
      'intent'
    );
  }

  cancelPaymentIntent() {
    return this._wrapPromiseReturn(
      'paymentIntentCancel',
      () => {
        RNStripeTerminal.cancelPaymentIntent();
      },
      'intent'
    );
  }

  abortCreatePayment() {
    return this._wrapPromiseReturn('abortCreatePaymentCompletion', () => {
      RNStripeTerminal.abortCreatePayment();
    });
  }

  abortDiscoverReaders() {
    return this._wrapPromiseReturn('abortDiscoverReadersCompletion', () => {
      RNStripeTerminal.abortDiscoverReaders();
    });
  }

  abortInstallUpdate() {
    return this._wrapPromiseReturn('abortInstallUpdateCompletion', () => {
      RNStripeTerminal.abortInstallUpdate();
    })
  }

  startService(options) {
    if (typeof options === 'string') {
      options = { policy: options };
    }

    if (this._currentService) {
      return Promise.reject(
        'A service is already running. You must stop it using `stopService` before starting a new service.',
      );
    }

    this._currentService = createConnectionService(this, options);
    this._currentService.start();
    return this._currentService;
  }

  stopService() {
    if (!this._currentService) {
      return Promise.resolve();
    }

    return this._currentService.stop().then(() => {
      this._currentService = null;
    });
  }
}

const StripeTerminal_ = new StripeTerminal();
export default StripeTerminal_;

export const {
  useStripeTerminalState,
  useStripeTerminalCreatePayment,
  useStripeTerminalConnectionManager,
} = createHooks(StripeTerminal_);
