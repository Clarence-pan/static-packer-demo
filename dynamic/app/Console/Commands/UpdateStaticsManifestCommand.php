<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Output\OutputInterface;

class UpdateStaticsManifestCommand extends Command
{
    protected function configure()
    {
        $this->setName('update-statics-manifest')
            ->addArgument('input', InputArgument::OPTIONAL, 'Input of the manifest(in JSON format)', '-');
    }

    public function handle()
    {
        try {
            $input = $this->argument('input');
            if ($input === '-') {
                $input = self::readToEnd(STDIN);
            } else if (!is_file($input)) {
                $this->error("Invalid input: " . $input);
                return 1;
            } else {
                $input = file_get_contents($input);
            }

            $inputData = json_decode($input, true);
            if (json_last_error() != JSON_ERROR_NONE) {
                $this->error("Invalid JSON format: " . json_last_error_msg());
                return 2;
            }

            if (empty($inputData)) {
                $this->warn("Nothing to be updated.");
                return 0;
            }

            if (!is_array($inputData)) {
                $this->error("Invalid data format: It must be an array!");
                return 3;
            }

            app()->statics->updateManifestData($inputData);

            $this->info('Updated.', OutputInterface::VERBOSITY_VERBOSE);
            return 0;
        } catch (\Exception $e) {
            $this->error("Got exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return 55;
        }
    }

    public static function readToEnd($file, $chunkSize = 4096)
    {
        $chunks = [];

        while (!feof($file)) {
            $read = fread($file, $chunkSize);
            if ($read === false) {
                break;
            }

            $chunks[] = $read;
        }

        return implode($chunks);
    }
}