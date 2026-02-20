import type { LoaderFunctionArgs } from "react-router";
import { testPythonEnvironment } from "../../lib/python-bridge";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Test Python environment
    const envTest = await testPythonEnvironment();
    
    if (!envTest.pythonAvailable) {
      return Response.json({
        success: false,
        error: 'Python environment not available',
        details: envTest
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      environment: envTest,
      message: 'Python environment is ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
