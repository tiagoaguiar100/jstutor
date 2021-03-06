var SourceExecution = require('./SourceExecution.js')
  , SourceManagement = require('./SourceManagement.js')
  , SourceInspection = require('./SourceInspection.js');

var StaticInspector = function() {
  var pendingCode = null;
  var isExecuting = false;
  var currentCode;
  var inspector = {};

  inspector.inspect = function(source_code, callback) {
    var user_program;
    var inspector;

    var attachDebugger = function(filename, proc, port) {
      console.log('debug ready');
      inspector = new SourceInspection(filename, proc, port);
      inspector.on('done', function(traces) {
        callback({
          'code': currentCode,
          'trace': traces
        });

        isExecuting = false;
        /*
        if (pendingCode) {
          var pc = pendingCode;
          pendingCode = null;
          session.inspect(pc);
        }
        */
      });
      inspector.on('infinite_loop', function(loginfo, refValues) {
        // socket.emit('loginfo', loginfo);
        // socket.emit('error', 'Too many loops. Possibly infinite loop');
        user_program.kill('SIGKILL');
      });
      inspector.on('error', function() {
        console.log('[static_server] Error in the debugger. Terminate user\' program');
        user_program.kill('SIGKILL');
      });
    }

    var executeSource = function(err, filename) {
      if (err) {
        // TODO: notify that some errors happened
      }
      user_program = SourceExecution.execute(filename);
      user_program.on('debug_ready', attachDebugger);
      user_program.on('error', function(data) {
        // console.log('[UserProgram Error]', data);
      });
    }

    if (!isExecuting) {
      isExecuting = true;
      currentCode = source_code;
      SourceManagement.save(source_code, executeSource);
    } else {
      pendingCode = source_code;
    }
  };

  return inspector;
};

module.exports = StaticInspector();
