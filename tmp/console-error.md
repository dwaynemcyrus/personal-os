installHook.js:1 -------------- RxDB Open Core RxStorage -------------------------------
You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie 
While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.
For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.
 https://rxdb.info/premium/?console=dexie 
If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.
---------------------------------------------------------------------
overrideMethod @ installHook.js:1
bulkWrite @ rxdb_plugins_storage-dexie.js?v=90633fda:6316
await in bulkWrite
instance.bulkWrite @ chunk-O3Q7BXRB.js?v=90633fda:51
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:3268
wrapCall @ chunk-TTQAZOMI.js?v=90633fda:3215
lockedRun @ chunk-TTQAZOMI.js?v=90633fda:3557
bulkWrite @ chunk-YKCJBOAE.js?v=90633fda:3268
ensureStorageTokenDocumentExists @ chunk-TTQAZOMI.js?v=90633fda:198
RxDatabaseBase2 @ chunk-TTQAZOMI.js?v=90633fda:3436
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3721
await in (anonymous)
createRxDatabase @ chunk-TTQAZOMI.js?v=90633fda:3737
(anonymous) @ db.ts:459
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
chunk-IPSZNNYG.js?v=90633fda:3367 Uncaught (in promise) RxError (SC34): 

Error message: Fields of type string that are used in an index, must have set the maxLength attribute in the schema
Error code: SC34
Find out more about this error here: https://rxdb.info/errors.html?console=errors#SC34 

--------------------
Parameters:
index: "type"
field: "type"
schema: {
  "version": 1,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "is_trashed": {
      "type": "boolean"
    },
    "trashed_at": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "owner": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "device_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "sync_rev": {
      "type": [
        "number",
        "null"
      ]
    },
    "type": {
      "type": "string"
    },
    "parent_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "content": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "is_pinned": {
      "type": "boolean"
    },
    "item_status": {
      "type": "string"
    },
    "priority": {
      "type": [
        "string",
        "null"
      ]
    },
    "due_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "start_date": {
      "type": [
        "string",
        "null"
      ]
    },
    "completed": {
      "type": "boolean"
    },
    "is_next": {
      "type": "boolean"
    },
    "is_someday": {
      "type": "boolean"
    },
    "is_waiting": {
      "type": "boolean"
    },
    "waiting_note": {
      "type": [
        "string",
        "null"
      ]
    },
    "waiting_started_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "depends_on": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "type": "string",
        "maxLength": 36
      }
    },
    "inbox_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "subtype": {
      "type": [
        "string",
        "null"
      ]
    },
    "url": {
      "type": [
        "string",
        "null"
      ]
    },
    "content_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "read_status": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_start": {
      "type": [
        "string",
        "null"
      ]
    },
    "period_end": {
      "type": [
        "string",
        "null"
      ]
    },
    "progress": {
      "type": [
        "number",
        "null"
      ]
    },
    "frequency": {
      "type": [
        "string",
        "null"
      ]
    },
    "target": {
      "type": [
        "number",
        "null"
      ]
    },
    "active": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "streak": {
      "type": [
        "number",
        "null"
      ]
    },
    "last_completed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "body": {
      "type": [
        "string",
        "null"
      ]
    },
    "capture_source": {
      "type": [
        "string",
        "null"
      ]
    },
    "processed": {
      "type": "boolean"
    },
    "processed_at": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_type": {
      "type": [
        "string",
        "null"
      ]
    },
    "result_id": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 36
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    },
    "sort_order": {
      "type": [
        "number",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "created_at",
    "updated_at",
    "is_trashed",
    "trashed_at",
    "type",
    "parent_id",
    "is_pinned",
    "item_status",
    "completed",
    "is_next",
    "is_someday",
    "is_waiting",
    "processed"
  ],
  "indexes": [
    "type",
    [
      "type",
      "is_trashed"
    ]
  ]
}

    at newRxError (chunk-IPSZNNYG.js?v=90633fda:3367:10)
    at rxdb_plugins_dev-mode.js?v=90633fda:575:21
    at Array.forEach (<anonymous>)
    at rxdb_plugins_dev-mode.js?v=90633fda:568:20
    at Array.forEach (<anonymous>)
    at checkSchema (rxdb_plugins_dev-mode.js?v=90633fda:550:24)
    at chunk-YKCJBOAE.js?v=90633fda:2931:37
    at Array.forEach (<anonymous>)
    at runPluginHooks (chunk-YKCJBOAE.js?v=90633fda:2931:20)
    at createRxSchema (chunk-TTQAZOMI.js?v=90633fda:413:5)
newRxError @ chunk-IPSZNNYG.js?v=90633fda:3367
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:575
(anonymous) @ rxdb_plugins_dev-mode.js?v=90633fda:568
checkSchema @ rxdb_plugins_dev-mode.js?v=90633fda:550
(anonymous) @ chunk-YKCJBOAE.js?v=90633fda:2931
runPluginHooks @ chunk-YKCJBOAE.js?v=90633fda:2931
createRxSchema @ chunk-TTQAZOMI.js?v=90633fda:413
(anonymous) @ chunk-TTQAZOMI.js?v=90633fda:3480
addCollections @ chunk-TTQAZOMI.js?v=90633fda:3476
(anonymous) @ db.ts:466
await in (anonymous)
getDatabase @ db.ts:490
init @ useDatabase.ts:16
(anonymous) @ useDatabase.ts:27
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18567
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
commitHookEffectListMount @ react-dom_client.js?v=90633fda:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=90633fda:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=90633fda:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=90633fda:11066
flushPassiveEffects @ react-dom_client.js?v=90633fda:13150
flushPendingEffects @ react-dom_client.js?v=90633fda:13088
performSyncWorkOnRoot @ react-dom_client.js?v=90633fda:13514
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=90633fda:13414
flushSpawnedWork @ react-dom_client.js?v=90633fda:13067
commitRoot @ react-dom_client.js?v=90633fda:12804
commitRootWhenReady @ react-dom_client.js?v=90633fda:12016
performWorkOnRoot @ react-dom_client.js?v=90633fda:11950
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<NowView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
ActiveView @ App.tsx:387
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<ActiveView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
App @ App.tsx:411
react_stack_bottom_frame @ react-dom_client.js?v=90633fda:18509
renderWithHooksAgain @ react-dom_client.js?v=90633fda:5729
renderWithHooks @ react-dom_client.js?v=90633fda:5665
updateFunctionComponent @ react-dom_client.js?v=90633fda:7475
beginWork @ react-dom_client.js?v=90633fda:8525
runWithFiberInDEV @ react-dom_client.js?v=90633fda:997
performUnitOfWork @ react-dom_client.js?v=90633fda:12561
workLoopSync @ react-dom_client.js?v=90633fda:12424
renderRootSync @ react-dom_client.js?v=90633fda:12408
performWorkOnRoot @ react-dom_client.js?v=90633fda:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=90633fda:13505
performWorkUntilDeadline @ react-dom_client.js?v=90633fda:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=90633fda:247
(anonymous) @ main.tsx:11
