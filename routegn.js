'use strict';

var q = require('q');
var winston = require('gn-logger');
var moment = require('moment');
var path = require('path');
var rootPath = path.normalize(__dirname + '/../../../');
var config = require(rootPath + 'config/config');
var ChargeService = require(rootPath + 'app/modules/service/charge');
var ChargeReminder = require(rootPath + 'app/modules/service/charge-reminder');
var TransactionSyncService = require(rootPath + 'app/modules/service/transaction-sync');
var NotificationSyncService = require(rootPath + 'app/modules/service/notification-sync');
var DisplayChargeService = require(rootPath + 'app/modules/service/display-charge');
var DisplaySubionService = require(rootPath + 'app/modules/service/display-subion');
var PDFService = require(rootPath + 'app/modules/service/pdf');
var ChargeBalanceSheet = require(rootPath + 'app/modules/service/charge-balance-sheet');
var SettingsService = require(rootPath + 'app/modules/service/settings');

var helper = require(rootPath + 'app/modules/helper/charge/charge');
var paymentHelper = require(rootPath + 'app/modules/helper/payment/payment');
var STATUS = require(rootPath + 'app/modules/helper/charge/status');
var HISTORY = require(rootPath + 'app/modules/helper/charge/history');
var PAYMENT_METHOD = require(rootPath + 'app/modules/helper/payment/payment-method');
var _ = require('lodash');
var underscore = require('underscore.string');

var db = require(rootPath + 'app/models');
var SubionService = require(rootPath + 'app/modules/service/subion');
var sequelize = require('sequelize');
var databases = require(rootPath + 'config/config')
	.databases;
var PaymentSettingsService = require(rootPath + 'app/modules/service/payment-settings');
var EmailSettingService = require(rootPath + 'app/modules/service/email-setting');
var error = require('gn-errors');
var GnError = error.GnError;
var KernelError = error.KernelError;
var ErrorHandler = error.ErrorHandler;
var GN = require('gn-base-es6');
var PromiseWillSend = require(rootPath + 'app/modules/service/mail/promise-will-send');
var converter = require(rootPath + 'app/modules/helper/converter');
var TransactionNoteService = require(rootPath + 'app/modules/service/transaction-note');

function Charge(req) {
	this.req = req;
	this.logger = winston(databases);
	this.user = req.user;
	this.errorService = new ErrorHandler(config, db.core);
	this.chargeService = new ChargeService();
	this.transactionSyncService = new TransactionSyncService();
	this.notificationSyncService = new NotificationSyncService();
	this.paymentSettingsService = new PaymentSettingsService();
	this.displayChargeService = new DisplayChargeService();
	this.displaySubionService = new DisplaySubionService();
	this.emailSettingService = new EmailSettingService();
	this.transactionNoteService = new TransactionNoteService();

	if (req.body) {
		this.data = _.clone(req.body, true);
	}
}

Charge.prototype.create = function () {
	var self = this;
	var defer = q.defer();
	var chargeObj = null;
	var subionChargeObj = null;

	var planId = self.req.params.id;

	if (self.req.route.path.indexOf('plan') !== -1 && !planId) {
		var err = new GnError('required_property', 'id', ['id']);
		return self.errorService.err(err);
	}

	self.chargeService.setData(self.data);

	try {
		self.chargeService.calculateTotal();
	} catch (error) {
		return self.errorService.err(error);
	}

	var saveChargeItems = function (user, charge) {
		chargeObj = charge;
		return self.chargeService.saveItems(user, charge, self.t);
	};

	var transactionSync = function (action, t) {
		return self.transactionSyncService[action]({
				transaction_id: chargeObj.id,
				type: 'charge'
			}, t)
			.then(function () {
				if (subionChargeObj) {
					return self.transactionSyncService[action]({
						transaction_id: subionChargeObj.subion_id,
						type: 'subion'
					}, t);
				}
			});
	};

	var notificationSync = function (t) {
		if (!planId) {
			return self.notificationSyncService.create({
				transaction_id: chargeObj.id,
				notification_url: chargeObj.notification_url,
				type: 'charge'
			}, t);
		} else {
			return self.notificationSyncService.create({
				transaction_id: subionChargeObj.subion_id,
				notification_url: subionChargeObj.notification_url,
				type: 'subion'
			}, t);
		}
	};

	var createSync = function () {
		return db.synchronization.sequelize.transaction(function (t) {
			return transactionSync('create', t)
				.then(notificationSync.bind(self, t));
		});
	};

	var saveChargeShippings = function (user) {
		return self.chargeService.saveShippings(user, chargeObj, self.t);
	};

	var saveChargeTrace = function () {
		return self.chargeService.trace(chargeObj, null, null, self.t);
	};

	var saveChargeHistory = function () {
		return self.chargeService.history(chargeObj.id, self.user.key, HISTORY.NEW, self.t);
	};

	var createSubion = function () {
		if (planId) {
			var subionService = new SubionService();

			return subionService
				.create(self.user, planId, chargeObj, self.data, self.t);
		}
	};

	var createDisplay = function () {
		return self.displayChargeService
			.createOrUpdate(self.user.account.id, chargeObj.id, self.t);
	};

	var createSubionDisplay = function () {
		if (chargeObj.subion_id) {
			return self.displaySubionService
				.createOrUpdate(self.user.account.id, chargeObj.subion_id, self.t);
		}
	};

	var runChargeSaveTransaction = function () {
		return db.sequelize.transaction({
			isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
		}, function (t) {
			self.t = t;

			return self.chargeService.create(self.user, null, t)
				.then(function (charge) {
					return saveChargeItems(self.user, charge);
				})
				.then(saveChargeShippings.bind(self, self.user))
				.then(saveChargeTrace)
				.then(saveChargeHistory)
				.then(createSubion)
				.then(function (subionCharge) {
					if (subionCharge)
						subionChargeObj = subionCharge;
				})
				.then(createDisplay)
				.then(createSubionDisplay)
				.then(createSync)
				.catch(function (err) {
					throw err;
				});
		});
	};

	var sync = function () {
		var promises = [];
		promises.push(self.transactionSyncService
			.sync('charge_id', chargeObj.id));

		if (subionChargeObj) {
			promises.push(self.transactionSyncService
				.sync('subion_id',
					subionChargeObj.subion_id)
			);
		}

		return q.all(promises)
			.catch((err) => {
				return transactionSync('schedule');
			})
			.catch(function (err) {
				self.transactionSyncService.createIssue(err, 'charge_id', chargeObj.id);
				if (subionChargeObj)
					self.transactionSyncService.createIssue(err, 'subion_id',
						subionChargeObj.subion_id);
			});
	};

	var resolve = function (result) {
		defer.resolve(helper.response(chargeObj.get(), subionChargeObj));

		return sync()
			.then(function () {
				return defer.promise;
			});
	};

	var reject = function (error) {
		self.logger.logError(self.req, error);
		return self.errorService.err(error);
	};

	// Promise chain that actually saves or reject a charge
	return runChargeSaveTransaction()
		.then(resolve)
		.catch(reject);
};

Charge.prototype.detail = function () {
	var self = this;
	var chargeId = self.req.params.id;

	if (!chargeId) {
		var err = new GnError('required_property', 'id', ['id']);
		return self.errorService.err(err);
	}

	var getTransactionNote = function () {
		return self.transactionNoteService
			.getChargeNote(chargeId);
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(function (charge) {

			if (!charge || Object.keys(charge)
				.length === 0) {
				throw new GnError('property_does_not_exists', 'id', ['id']);
			}

			return getTransactionNote(chargeId)
				.then(function (transactionNote) {

					if (transactionNote) {
						charge.note = transactionNote.note;
					}

					return helper.detail(charge)
						.then(function (detailed) {
							return detailed;
						});
				});
		})
		.catch(function (err) {
			return self.errorService.err(err);
		});
};

Charge.prototype.sendBilletReminder = function () {
	var chargeReminder = new ChargeReminder(this.req);
	return chargeReminder.billetReminder();
};

Charge.prototype.updateMetadata = function () {
	var defer = q.defer();
	var self = this;
	var chargeId = self.req.params.id;
	var charge;

	var notificationSync = function (instant, t) {
		return self.notificationSyncService
			.schedule({
				transaction_id: chargeId,
				type: 'charge',
				notification_url: charge.notification_url,
				instant: instant
			}, t);
	};

	var scheduleSync = function (instant) {
		return db.synchronization.sequelize.transaction(function (t) {
			return notificationSync(instant, t);
		});
	};

	var getTransactionNote = function () {
		return self.transactionNoteService
			.getChargeNote(chargeId, self.t);
	};

	var updateMetadata = function (data, transactionNote) {

		return self.chargeService.getByIdAndApiKeyId(chargeId, self.user.id,
				self.user.app.id, self.t)
			.then(function (chargeObj) {
				if (chargeObj) {

					chargeObj.notification_url = data.notification_url === undefined ?
						chargeObj.notification_url : data.notification_url;
					chargeObj.custom_id = data.custom_id || chargeObj.custom_id;

					var options = {};

					if (self.t) {
						options.transaction = self.t;
					}

					charge = chargeObj;
					return chargeObj.save(options)
						.then(function () {

							if (data.note === undefined) {
								return;
							}

							if (!data.note || data.note.trim() === '') {
								return self.transactionNoteService
									.removeChargeNote(chargeId, self.t);
							}

							if (data.note && data.note.trim() !== '') {

								if (!transactionNote) {
									return self.transactionNoteService
										.createChargeNote(chargeId, data.note, self.t);
								}

								return self.transactionNoteService
									.updateChargeNote(chargeId, data.note, self.t);
							}
						});
				} else {
					throw new GnError('property_does_not_exists', 'id', ['id']);
				}
			});
	};

	var runInTransaction = function (data) {
		return db.sequelize.transaction(function (t) {
			self.t = t;
			return getTransactionNote()
				.then(function (transactionNote) {
					return updateMetadata(data, transactionNote)
						.then(function (response) {
							return scheduleSync(true);
						});
				});
		});
	};

	var resolve = function () {
		defer.resolve(200);
		return defer.promise;
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	return runInTransaction(self.data)
		.then(resolve)
		.catch(error);
};

Charge.prototype.cancel = function () {
	var self = this;
	var chargeId = self.req.params.id;
	var gn = new GN(config);
	var current = null;
	var defer = q.defer();
	var status = '';
	var oldStatus = '';

	var updateConditionally = function (charge, t) {
		if (!charge) {
			throw new GnError('property_does_not_exists', 'charge_id', ['charge_id']);
		}

		current = charge;
		oldStatus = charge.status;

		var cancelable = charge.status === STATUS.NEW ||
			charge.status === STATUS.LINK ||
			charge.status === STATUS.UNPAID || (
				charge.status === STATUS.WAITING &&
				charge.charge_payment &&
				charge.charge_payment.base_key &&
				charge.charge_payment.payment_method
			);

		if (!cancelable) {
			throw new GnError('charge_not_cancelable');
		}

		if (charge.status === STATUS.WAITING &&
			charge.charge_payment.payment_method === PAYMENT_METHOD.CREDIT_CARD) {
			throw new GnError('invalid_charge_payment_method');
		}

		if (charge.carnet_id ||
			(charge.status === STATUS.WAITING &&
				charge.charge_payment.payment_method === PAYMENT_METHOD.CARNET)) {
			throw new GnError('invalid_endpoint_usage');
		}

		return self.chargeService
			.updateConditionally({
				status: STATUS.CANCELED
			}, {
				status: {
					[sequelize.Op.ne]: STATUS.CANCELED
				},
				id: charge.id
			}, t)
			.spread(function (affectedCount) {
				if (affectedCount !== 1) {

					throw new GnError('charge_not_cancelable');
				}

				return charge;
			});
	};

	var transactionSync = function (t, instant) {
		return self.transactionSyncService
			.schedule({
				transaction_id: current.id,
				type: 'charge',
				instant: instant
			}, t)
			.then(function () {
				if (current.subion_id) {
					return self.transactionSyncService
						.schedule({
							transaction_id: current.subion_id,
							type: 'subion',
							instant: instant
						}, t);
				} else if (current.carnet_id) {
					return self.transactionSyncService
						.schedule({
							transaction_id: current.carnet_id,
							type: 'carnet',
							instant: instant
						}, t);
				}
			});
	};

	var notificationSync = function (t, instant) {
		if (current.carnet_id) {
			return self.notificationSyncService.schedule({
				transaction_id: current.carnet_id,
				notification_url: current.notification_url,
				type: 'carnet',
				instant: instant
			}, t);
		} else if (current.subion_id) {
			return self.notificationSyncService.schedule({
				transaction_id: current.subion_id,
				notification_url: current.notification_url,
				type: 'subion',
				instant: instant
			}, t);
		} else {
			return self.notificationSyncService.schedule({
				transaction_id: current.id,
				notification_url: current.notification_url,
				type: 'charge',
				instant: instant
			}, t);
		}
	};

	var scheduleSync = function (instant) {
		return db.synchronization.sequelize.transaction(function (t) {
			return transactionSync(t, instant)
				.then(function () {
					return notificationSync(t, instant);
				});
		});
	};

	var sync = function () {
		var promises = [];

		promises.push(self.transactionSyncService
			.sync('charge_id', current.id));
		promises.push(self.transactionSyncService
			.sync('subion_id', current.subion_id));
		promises.push(self.transactionSyncService
			.sync('carnet_id', current.carnet_id));

		return q.all(promises)
			.catch((err) => {
				return transactionSync(null, true);
			})
			.catch(function (err) {
				self.transactionSyncService.createIssue(err, 'charge_id', current.id);
				if (current.carnet_id)
					self.transactionSyncService.createIssue(err, 'carnet_id', current.carnet_id);
				if (current.subion_id)
					self.transactionSyncService.createIssue(err, 'subion_id', current
						.subion_id);
			});
	};

	var cancelOnKernel = function () {
		if (oldStatus === STATUS.WAITING || oldStatus === STATUS.UNPAID) {
			var input = {
				Conta: self.user.account.number,
				Identificador: current.charge_payment.base_key
			};

			return gn.pagamentoCancelar(input, {
					path: '/pagamento/cancelar',
					ip: self.req.ipv4 ? self.req.ipv4 : null,
					userAgent: self.req.headers['user-agent'] ? self.req.headers['user-agent'] : null
				})
				.catch(function (err) {
					throw new KernelError(err);
				});
		} else if (oldStatus === STATUS.NEW || oldStatus === STATUS.LINK) {
			defer.resolve({
				StatusCod: '2'
			});
			return defer.promise;
		}
	};

	var checkResponse = function (response) {
		if (response && response.StatusCod === '2') {
			return;
		}

		throw new KernelError(response);
	};

	var saveChargeTrace = function () {
		return self.chargeService.traceStatus(current, STATUS.CANCELED, null, null, self.t);
	};

	var saveChargeHistory = function () {
		return self.chargeService.history(current.id, self.user.key, HISTORY.CANCELED, self.t);
	};

	var updateChargeDisplay = function () {
		return self.displayChargeService
			.createOrUpdate(self.user.account.id, chargeId, self.t);
	};

	var updateSubionDisplay = function () {
		if (current.subion_id) {
			return self.displaySubionService
				.createOrUpdate(self.user.account.id, current.subion_id, self.t);
		}
	};

	var sendMail = function () {
		return self.emailSettingService
			.findCoreEmailSettingsByAccountId(self.user.account.id)
			.then(function (settings) {
				var hasSendMailParamDefined = self.req.body.send_email !== null &&
					self.req.body.send_email !== undefined;
				var hasCoreSettings = !!settings;

				var shouldSendEmail = (hasSendMailParamDefined) ? self.req.body.send_email :
					((hasCoreSettings) ? settings.charge_cancel : true);

				if (!shouldSendEmail) {
					return;
				}

				var send = new PromiseWillSend(self.req);

				if (current.subion_id) {
					return send.sendSubionChargeCanceled(current, current.subion);
				}

				return send.sendChargeCanceled(current);
			});
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(function (charge) {
			return db.sequelize.transaction(function (t) {
				return updateConditionally(charge, t)
					.then(function () {
						return scheduleSync(false);
					});
			});
		})
		.then(function () {
			return db.sequelize.transaction(function (t) {
					self.t = t;
					return updateChargeDisplay()
						.then(updateSubionDisplay)
						.then(saveChargeTrace)
						.then(saveChargeHistory)
						.then(cancelOnKernel)
						.then(checkResponse);
				})
				.catch(function (err) {
					return self.chargeService
						.updateStatus(current, oldStatus)
						.then(function () {
							throw err;
						});
				});
		})
		.then(function () {
			notificationSync(null, true);
			sendMail();
			return sync();
		})
		.catch(error);
};

Charge.prototype.createHistory = function () {
	var self = this;

	var chargeId = self.req.params.id;

	var saveChargeHistory = function (charge) {
		if (!charge) {
			throw new GnError('property_does_not_exists', 'charge_id', ['charge_id']);
		}

		return self.chargeService
			.history(charge.id, self.user.key, underscore.stripTags(self.data.deion));
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(saveChargeHistory)
		.catch(error);
};

Charge.prototype.settle = function () {
	var self = this;
	var charge = null;
	var chargeId = self.req.params.id;
	var oldStatus = null;

	var updateStatus = function (_charge, t) {
		if (!_charge) {
			throw new GnError('property_does_not_exists', 'charge_id', ['charge_id']);
		}

		charge = _charge;
		oldStatus = _charge.status;

		if ([STATUS.WAITING, STATUS.UNPAID].indexOf(_charge.status) === -1) {
			throw new GnError('charge_is_not_waiting_nor_unpaid');
		}

		if (_charge.status === STATUS.WAITING &&
			_charge.charge_payment.payment_method === 'credit_card') {
			throw new GnError('invalid_charge_payment_method');
		}

		if (_charge.carnet_id ||
			(_charge.status === STATUS.WAITING &&
				_charge.charge_payment.payment_method === PAYMENT_METHOD.CARNET)) {
			throw new GnError('invalid_endpoint_usage');
		}

		return self.chargeService.updateConditionally({
				status: STATUS.SETTLED
			}, {
				status: {
					[sequelize.Op.ne]: STATUS.SETTLED
				},
				id: _charge.id
			}, t)
			.spread(function (affectedCount) {
				if (affectedCount !== 1)
					throw new GnError('charge_is_not_new_nor_waiting_nor_unpaid');

				return _charge;
			});
	};

	var saveTrace = function () {
		return self.chargeService
			.traceStatus(charge, STATUS.SETTLED, null, null, self.t);
	};

	var saveChargeHistory = function (trace) {
		charge.charge_traces.push(trace);

		return self.chargeService
			.history(charge.id, self.user.key, HISTORY.SETTLED, self.t);
	};

	var saveChargeHistoryEmail = function (trace) {
		if (!charge.customer.email) {
			return;
		}

		var action = HISTORY.getSendEmailSettledHistory(charge.customer.email);
		return self.chargeService
			.history(charge.id, self.user.key, action);
	};

	var updateChargeDisplay = function () {
		return self.displayChargeService
			.createOrUpdate(self.user.account.id, chargeId, self.t);
	};

	var updateSubionDisplay = function () {
		if (charge.subion_id) {
			return self.displaySubionService
				.createOrUpdate(self.user.account.id, charge.subion_id, self.t);
		}
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	var notificationSync = function (instant, t) {
		if (charge.subion_id) {
			return self.notificationSyncService
				.schedule({
					transaction_id: charge.subion_id,
					notification_url: charge.notification_url,
					type: 'subion',
					instant: instant
				}, t);
		} else if (charge.carnet_id) {
			return self.notificationSyncService
				.schedule({
					transaction_id: charge.carnet_id,
					notification_url: charge.notification_url,
					type: 'carnet',
					instant: instant
				}, t);
		} else {
			return self.notificationSyncService
				.schedule({
					transaction_id: charge.id,
					notification_url: charge.notification_url,
					type: 'charge',
					instant: instant
				}, t);
		}
	};

	var sendEmail = function () {

		if (!charge.customer.email) {
			return;
		}

		return self.emailSettingService
			.findCoreEmailSettingsByAccountId(self.user.account.id)
			.then(function (settings) {
				var hasSendMailParamDefined = self.req.body.send_email !== null &&
					self.req.body.send_email !== undefined;
				var hasCoreSettings = !!settings;

				var shouldSendEmail = (hasSendMailParamDefined) ? self.req.body.send_email :
					((hasCoreSettings) ? settings.settled : true);

				if (!shouldSendEmail) {
					return;
				}

				var send = new PromiseWillSend(self.req);

				if (charge.subion_id) {
					return send.sendSubionChargeSettle(charge, charge.subion)
						.then(saveChargeHistoryEmail);
				}

				return send.sendChargeSettle(charge)
					.then(saveChargeHistoryEmail);

			});
	};

	var updatePaidValue = function () {
		var paidAt = moment()
			.format('YYYY-MM-DD HH:mm:ss');

		charge.charge_payment.paid_value = charge.charge_payment.total;
		charge.charge_payment.paid_at = paidAt;

		return charge.charge_payment.save({
			transaction: self.t
		});
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id)
		.then(function (charge) {
			return updateStatus(charge)
				.then(function () {
					return notificationSync(false);
				});
		})
		.then(function () {
			return db.sequelize.transaction(function (t) {
				return db.synchronization.sequelize.transaction(function (syncT) {
					self.t = t;
					return updatePaidValue()
						.then(updateChargeDisplay)
						.then(updateSubionDisplay)
						.then(saveTrace)
						.then(saveChargeHistory)
						.then(function (history) {
							charge.charge_histories.push(history);

							return notificationSync(true, syncT);
						});
				});
			});
		})
		.then(function () {
			sendEmail();
		})
		.catch(function (err) {
			if (oldStatus) {
				self.chargeService.updateConditionally({
					status: oldStatus
				}, {
					id: chargeId
				});
			}

			throw err;
		})
		.catch(error);
};

Charge.prototype.link = function () {
	var self = this;
	var chargeId = self.req.params.id;
	var settings = null;
	var defer = q.defer();

	if (!chargeId) {
		var err = new GnError('required_property', 'id', ['id']);
		return self.errorService.err(err);
	}

	var transactionSync = function (charge, instant, t) {
		return self.transactionSyncService.schedule({
			transaction_id: charge.id,
			type: 'charge',
			instant: instant
		}, t);
	};

	var notificationSync = function (charge, instant, t) {
		return self.notificationSyncService.schedule({
			transaction_id: charge.id,
			notification_url: charge.notification_url,
			type: 'charge',
			instant: instant
		}, t);
	};

	var scheduleSync = function (charge, instant) {
		return db.synchronization.sequelize.transaction(function (t) {
			return transactionSync(charge, instant, t)
				.then(function () {
					return notificationSync(charge, instant, t);
				});
		});
	};

	var sync = function (charge) {
		var promises = [];

		promises.push(self.transactionSyncService
			.sync('charge_id', charge.id));
		promises.push(self.transactionSyncService
			.sync('subion_id', charge.subion_id));

		return q.all(promises)
			.catch((err) => {
				return transactionSync(charge, true);
			})
			.catch(function (err) {
				self.transactionSyncService.createIssue(err, 'charge_id', charge.id);

				if (charge.subion_id)
					self.transactionSyncService.createIssue(err, 'subion_id', charge
						.subion_id);
			});

	};

	var saveTrace = function (charge, t) {
		return self.chargeService.trace(charge, null, null, t);
	};

	var saveChargeHistory = function (charge, trace, t) {
		charge.charge_traces.push(trace);

		return self.chargeService.history(charge.id, self.user.key, HISTORY.LINK, t);
	};

	var updateChargeDisplay = function (charge, t, t2) {
		return self.displayChargeService
			.createOrUpdate(self.user.account.id, charge.id, t, t2);
	};

	var updateSubionDisplay = function (charge, t) {
		if (charge.subion_id) {
			return self.displaySubionService
				.createOrUpdate(self.user.account.id, charge.subion_id, t);
		}
	};

	var getAccountSettings = function () {
		return new SettingsService()
			.getByAccountId(self.user.account.id);
	};

	var createLink = function (charge, accountSettings) {
		var conditionalDiscount = self.data.conditional_discount || {};
		var message = null;

		if (self.data.message === undefined && accountSettings.message) {
			message = _.unescape(accountSettings.message);
		} else if (self.data.message) {
			message = self.data.message;
		}

		var data = {
			charge_id: charge.id,
			subion_id: charge.subion_id,
			sandbox: config.server.sandbox || false,
			request_delivery_address: self.data.request_delivery_address,
			expire_at: self.data.expire_at,
			message: message,
			billet_discount: self.data.billet_discount,
			card_discount: self.data.card_discount,
			payment_method: self.data.payment_method,
			conditional_discount_value: conditionalDiscount.value,
			conditional_discount_type: conditionalDiscount.type,
			conditional_discount_date: conditionalDiscount.until_date
		};

		return db.sequelize.transaction(function (t) {
			return db.common.sequelize.transaction(function (t2) {
				return self.paymentSettingsService.create(data, t2)
					.then(function (response) {
						if (!response) {
							throw new GnError('server_error');
						}

						settings = response;
					})
					.then(function () {
						return self.chargeService
							.updateConditionally({
								status: STATUS.LINK,
								payment_setting_id: settings.id
							}, {
								id: charge.id,
								status: {
									[sequelize.Op.not]: STATUS.LINK
								}
							}, t)
							.spread(function (affectedCount) {
								if (affectedCount !== 1)
									throw new GnError('invalid_status', null, [STATUS.NEW]);

								charge.status = STATUS.LINK;
								charge.payment_setting_id = settings.id;
								return charge;
							});
					})
					.then(function (charge) {
						return saveTrace(charge, t)
							.then(function (trace) {
								return saveChargeHistory(charge, trace, t);
							})
							.then(function () {
								return charge;
							});
					})
					.then(function (charge) {
						return updateChargeDisplay(charge, t, t2)
							.then(function () {
								return updateSubionDisplay(charge, t);
							})
							.then(function () {
								return charge;
							});
					})
					.then(function (charge) {
						return scheduleSync(charge, true)
							.then(function () {
								return charge;
							});
					});
			});
		});
	};

	var resolve = function (charge) {
		defer.resolve(helper.link(charge, null, settings));
		return sync(charge)
			.then(function () {
				return defer.promise;
			});
	};

	var validate = function (charge) {
		if (!charge || Object.keys(charge)
			.length === 0) {
			throw new GnError('property_does_not_exists', 'id', ['id']);
		}

		if (charge.status !== STATUS.NEW && charge.payment_setting) {
			throw new GnError('charge_already_has_payment_link');
		}

		if (charge.has_marketplace &&
			(self.data.billet_discount || self.data.card_discount || self.data.conditional_discount)
		) {
			throw new GnError('invalid_discount_in_marketplace');
		}

		if (charge.status !== STATUS.NEW) {
			throw new GnError('invalid_status', null, [STATUS.NEW]);
		}

		if (charge.subion_id || charge.carnet_id) {
			throw new GnError('invalid_property', 'id', ['id']);
		}

		if (['banking_billet', 'all'].indexOf(self.data.payment_method) !== -1) {
			var billetDiscount = self.data.billet_discount || 0;
			var conditionalDiscount = self.data.conditional_discount;
			var conditionalDiscountValue = 0;

			if (conditionalDiscount) {
				conditionalDiscountValue = paymentHelper.calculateDiscount(
					charge.value, conditionalDiscount.value, conditionalDiscount.type
				);
			}

			if (billetDiscount && charge.value - billetDiscount < 500) {
				throw new GnError('invalid_property', 'billet_discount', ['billet_discount']);
			}

			if (conditionalDiscount && charge.value - billetDiscount - conditionalDiscountValue <
				500) {
				throw new GnError('invalid_property', 'conditional_discount', ['conditional_discount']);
			}
		}

		if (charge.value - self.data.card_discount < 500 && ['credit_card', 'all'].indexOf(
				self.data.payment_method) !== -1) {
			throw new GnError('invalid_property', 'card_discount', ['card_discount']);
		}

		if (moment(self.data.expire_at)
			.isBefore(moment(), 'day')) {
			throw new GnError('invalid_property', 'expire_at', ['expire_at']);
		}
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(function (charge) {
			validate(charge);
			return [charge, getAccountSettings()];
		})
		.spread(createLink)
		.then(resolve)
		.catch(function (err) {
			return self.errorService.err(err);
		});
};

Charge.prototype.updateLink = function () {
	var self = this;
	var chargeId = self.req.params.id;
	var settings = null;
	var defer = q.defer();
	var data;
	if (!chargeId) {
		var err = new GnError('required_property', 'id', ['id']);
		return self.errorService.err(err);
	}

	var transactionSync = function (charge, instant, t) {
		return self.transactionSyncService.schedule({
				transaction_id: charge.id,
				type: 'charge',
				instant: instant
			}, t)
			.then(function () {
				if (charge.subion_id) {
					return self.transactionSyncService.schedule({
						transaction_id: charge.subion_id,
						type: 'subion',
						instant: instant
					}, t);
				}
			});
	};

	var scheduleSync = function (charge, instant) {
		return db.synchronization.sequelize.transaction(function (t) {
			return transactionSync(charge, instant, t);
		});
	};

	var sync = function (charge) {
		var promises = [];
		promises.push(self.transactionSyncService
			.sync('charge_id', charge.id));
		promises.push(self.transactionSyncService
			.sync('subion_id', charge.subion_id));

		return q.all(promises)
			.catch((err) => {
				return transactionSync(charge, true);
			})
			.catch(function (err) {
				self.transactionSyncService.createIssue(err, 'charge_id', charge.id);

				if (charge.subion_id)
					self.transactionSyncService.createIssue(err, 'subion_id', charge
						.subion_id);
			});
	};

	var updateChargeDisplay = function (charge, t, t2) {
		return self.displayChargeService
			.createOrUpdate(self.user.account.id, charge.id, t, t2);
	};

	var updateSubionDisplay = function (charge, t) {
		if (charge.subion_id) {
			return self.displaySubionService
				.createOrUpdate(self.user.account.id, charge.subion_id, t);
		}
	};

	var updateLink = function (charge) {
		return db.common.sequelize.transaction(function (t2) {
			settings = charge.payment_setting;
			var oldExpireAt = moment(settings.expire_at)
				.format('YYYY-MM-DD');

			settings.request_delivery_address = data.request_delivery_address;
			settings.expire_at = data.expire_at;
			settings.message = converter.paymentMessageFormat(data.message, true, false);
			settings.billet_discount = data.billet_discount;
			settings.card_discount = data.card_discount;
			settings.payment_method = data.payment_method;
			settings.conditional_discount_value = data.conditional_discount_value;
			settings.conditional_discount_type = data.conditional_discount_type;
			settings.conditional_discount_date = data.conditional_discount_date;

			return settings.save({
					transaction: t2
				})
				.then(function () {
					if (oldExpireAt !== settings.expire_at) {
						return db.sequelize.transaction(function (t) {
							if (charge.status === 'expired') {
								charge.status = 'link';
							}

							return charge.save({
									transaction: t
								})
								.then(function () {
									var action = HISTORY.UPDATE_LINK;
									var expireAt = moment(self.data.expire_at)
										.format('DD/MM/YYYY');
									oldExpireAt = moment(oldExpireAt, 'YYYY-MM-DD')
										.format('DD/MM/YYYY');
									action = action.replace('%s', oldExpireAt);
									action = action.replace('%s', expireAt);

									return self.chargeService.history(charge.id, self.user.key,
										action, t);
								})
								.then(function () {
									return updateChargeDisplay(charge, t, t2);
								})
								.then(function () {
									return updateSubionDisplay(charge, t);
								});
						});
					}
				})
				.then(function () {
					return scheduleSync(charge, false);
				})
				.then(function () {
					return charge;
				});
		});
	};

	var resolve = function (charge) {
		defer.resolve(helper.link(charge, charge.subion, settings));
		return defer.promise;
	};

	var validate = function (charge) {
		if (!charge || Object.keys(charge)
			.length === 0) {
			throw new GnError('property_does_not_exists', 'id', ['id']);
		}

		if ((charge.status !== STATUS.LINK && charge.status !== STATUS.EXPIRED) ||
			!charge.payment_setting) {
			throw new GnError('invalid_status', null, [STATUS.LINK]);
		}

		var settings = charge.payment_setting;
		var message = null;
		if (self.data.message !== '' && self.data.message !== null) {
			message = self.data.message;
		} else if (settings.message) {
			message = settings.message;
		}

		var expireAt = self.data.expire_at || settings.expire_at;
		var requestDelivery = self.data.request_delivery_address || settings
			.request_delivery_address;
		var billetDiscount = (self.data.billet_discount === null) ? null :
			(self.data.billet_discount) ? self.data.billet_discount :
			settings.billet_discount;
		var cardDiscount = (self.data.card_discount === null) ? null :
			(self.data.card_discount) ? self.data.card_discount :
			settings.card_discount;
		var paymentMethod = self.data.payment_method || settings.payment_method;
		var conditionalDiscount = self.data.conditional_discount;

		if (conditionalDiscount === null) {
			conditionalDiscount = {
				value: null,
				type: null,
				until_date: null
			};
		} else if (conditionalDiscount === undefined) {
			conditionalDiscount = {
				value: settings.conditional_discount_value,
				type: settings.conditional_discount_type,
				until_date: settings.conditional_discount_date,
			};
		}

		data = {
			request_delivery_address: requestDelivery,
			expire_at: expireAt,
			message: message,
			billet_discount: billetDiscount,
			card_discount: cardDiscount,
			payment_method: paymentMethod,
			conditional_discount_value: conditionalDiscount.value,
			conditional_discount_type: conditionalDiscount.type,
			conditional_discount_date: conditionalDiscount.until_date
		};

		if (['banking_billet', 'all'].indexOf(data.payment_method) !== -1) {
			var conditionalDiscountValue = 0;
			if (conditionalDiscount.value) {
				conditionalDiscountValue = paymentHelper.calculateDiscount(
					charge.value, conditionalDiscount.value, conditionalDiscount.type
				);
			}

			if (data.billet_discount && charge.value - data.billet_discount < 500) {
				throw new GnError('invalid_property', 'billet_discount', ['billet_discount']);
			}

			if (conditionalDiscountValue &&
				charge.value - (data.billet_discount || 0) - conditionalDiscountValue < 500) {
				throw new GnError('invalid_property', 'conditional_discount', ['conditional_discount']);
			}
		}

		if (data.card_discount && charge.value - data.card_discount < 500 && [
				'credit_card', 'all'
			].indexOf(data.payment_method) !== -1) {
			throw new GnError('invalid_property', 'card_discount', ['card_discount']);
		}

		if (moment(data.expire_at)
			.isBefore(moment(), 'day')) {
			throw new GnError('invalid_property', 'expire_at', ['expire_at']);
		}
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(function (charge) {
			validate(charge);
			return updateLink(charge);
		})
		.then(function (charge) {
			return sync(charge)
				.then(function () {
					return charge;
				});
		})
		.then(resolve)
		.catch(function (err) {
			return self.errorService.err(err);
		});
};

Charge.prototype.file = function (filed) {
	var self = this;
	var chargeId = self.req.params.id;
	var paymentMethod = self.data.payment_method;
	var oldStatus = null;

	var validate = function (_charge) {
		if (!_charge) {
			throw new GnError('property_does_not_exists', 'charge_id', ['charge_id']);
		}

		return _charge;
	};

	var updateChargeDisplay = function (transaction) {

		return self.displayChargeService
			.file(self.user.account.id, chargeId, filed, transaction);
	};

	var updateLinkDisplay = function (transaction) {

		return self.displayChargeService
			.file_payment_link(self.user.account.id, chargeId, filed, transaction);
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	var saveChargeHistory = function (transaction) {

		let actionHistory = filed ? HISTORY.FILED : HISTORY.RESTORE;
		return self.chargeService
			.history(chargeId, self.user.key, actionHistory, transaction);

	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(validate)
		.then(function (charge) {

			return db.sequelize.transaction(function (t) {

				if (paymentMethod === 'link') {
					return updateLinkDisplay(t)
						.then(saveChargeHistory(t));
				} else {
					return updateChargeDisplay(t)
						.then(saveChargeHistory(t));
				}

			});
		})
		.catch(error);
};

Charge.prototype.createBalanceSheet = function () {
	var self = this;
	var chargeId = parseInt(self.req.params.id);
	var balanceSheetService = new ChargeBalanceSheet();

	var validate = function (charge) {
		if (!charge)
			throw new GnError('property_does_not_exists', 'charge_id', ['charge_id']);

		if (charge.subion_id || charge.carnet_id)
			throw new GnError('api_charge_cannot_belongs_to_carnet_or_subion');

		if (charge.status !== STATUS.NEW)
			throw new GnError('invalid_status', null, [STATUS.NEW]);

		return balanceSheetService
			.findByChargeId(chargeId)
			.then((chargeBalanceSheet) => {
				if (chargeBalanceSheet) {
					throw new GnError('api_balance_sheet_already_exists');
				}
			});
	};

	var sendRequest = function () {
		var pdfService = new PDFService();
		var data = self.req.body;
		return pdfService.createBalanceSheet(data);
	};

	var save = function (pdfResponse) {
		return balanceSheetService.create(chargeId, pdfResponse.id);
	};

	var error = function (err) {
		return self.errorService.err(err);
	};

	return self.chargeService
		.getByIdAndApiKeyId(chargeId, self.user.id, self.user.app.id)
		.then(validate)
		.then(sendRequest)
		.then(save)
		.catch(error);
};

module.exports = Charge;
