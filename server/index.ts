import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { globalErrorHandler, notFoundHandler, setupProcessErrorHandlers } from "./middleware/errorHandler.middleware";

const app = express();

// Configure JSON parsing with proper error handling
app.use(express.json({ 
  limit: '50mb',
  strict: true,
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup global process error handlers for uncaught exceptions and unhandled rejections
  setupProcessErrorHandlers();
  
  try {
    // Environment variable checks
    const nodeEnv = process.env.NODE_ENV || 'development';
    const port = parseInt(process.env.PORT || '5000', 10);
    
    console.log('🚀 Starting server...');
    console.log(`📦 NODE_ENV: ${nodeEnv}`);
    console.log(`🔌 PORT: ${port}`);
    console.log(`🏠 HOST: 0.0.0.0`);
    
    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT environment variable: ${process.env.PORT}`);
    }
    
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    
    // 404 handler for unknown API routes - MUST be after all API routes but BEFORE Vite
    app.use('/api/*', notFoundHandler);

    // Global error handler - MUST be after all routes and middleware
    app.use(globalErrorHandler);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (nodeEnv === "development") {
      console.log('🔧 Setting up Vite development server...');
      await setupVite(app, server);
      console.log('✅ Vite development server ready');
    } else {
      console.log('📁 Setting up production static file serving...');
      serveStatic(app);
      console.log('✅ Production static files configured');
      console.log('   - Serving from: dist/public');
      console.log('   - Static assets: /assets/*');
      console.log('   - SPA fallback: index.html');
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      console.log('✅ Server started successfully!');
      log(`serving on port ${port}`);
      console.log(`🌐 Server is ready at http://0.0.0.0:${port}`);
      console.log(`🔒 Environment: ${nodeEnv}`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      console.error('❌ Server failed to start:');
      if (err.code === 'EADDRINUSE') {
        console.error(`   Port ${port} is already in use`);
        console.error(`   Try setting a different PORT environment variable`);
      } else if (err.code === 'EACCES') {
        console.error(`   Permission denied to bind to port ${port}`);
        console.error(`   Port ${port} requires elevated privileges or is restricted`);
      } else {
        console.error(`   Error: ${err.message}`);
        console.error(`   Code: ${err.code}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Fatal error during server initialization:');
    console.error(error);
    process.exit(1);
  }
})();
