import React, { useState, useEffect } from 'react'
import { Sheet, Button, List, ListItem, Typography } from '@mui/joy'
import { wsp } from '../../API/ogmiosApi'
import { useColorScheme } from '@mui/joy/styles'
import { decode } from 'cbor-x'

export const OnChainProposalComponent: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([])
  const { mode, setMode } = useColorScheme()

  console.log('mode', mode)

  const getProposal = async () => {
    const method: string = 'queryLedgerState/governanceProposals'
    const params = {
      params: {
        proposals: []
      }
    }

    let wspRes = wsp(method, params)
    wspRes.onmessage = (e: any) => {
      const results = JSON.parse(e.data)
      parseResults(results.result)
    }
  }

  const parseResults = async (results: any[]): Promise<void> => {
    setProposals([])
    console.log('results', results)
    try {
      const parsedProposals = await Promise.all(
        results.map(async (proposal: any) => {
          const metadataUri = proposal.metadata.url
          const metadata: any = await loadJsonMetadata(metadataUri)
          const propInfo: any = { proposal, metadata }
          console.log('propInfo', propInfo)
          return propInfo
        })
      )
      setProposals((prevArray: any[]) => [...prevArray, ...parsedProposals])
      console.log('parsedProposals', parsedProposals)
    } catch (error) {
      console.log('Error parsing results:', error)
      // Handle error appropriately, perhaps by showing a message to the user
    }
  }

  const loadJsonMetadata = async (metadataUri: any) => {
    const response = await fetch(metadataUri)
    console.log('response', response)
    const jsonData: any[] = response.status !== 404 ? await response.json() : null
    console.log('jsonData', jsonData)
    return jsonData
  }

  const toBuffer = (hex: string) => {
    let Buffer = require('buffer/')
    return Buffer.Buffer.from(hex, 'hex')
  }
  const fromBuffer = (bytes: any) => {
    let Buffer = require('buffer/')
    return Buffer.Buffer.from(bytes).toString('hex')
  }
  const hex2a = (hexx: any) => {
    var hex = hexx.toString()
    var str = ''
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    return str
  }
  const metadataCbortoJSON = async (cborString: string) => {
    cborString = 'your_cbor_string_here' // Replace with actual string or remove this line if you're passing it
    try {
      const metadataJSONBuffer = await toBuffer(cborString)
      const metadataCBOR = decode(metadataJSONBuffer)
      const onetoHex = fromBuffer(metadataCBOR['0'])
      console.log('cborJson', onetoHex)
      return metadataCBOR
    } catch (error) {
      console.log('cborJson Error', error)
      return error
    }
  }

  useEffect(() => {
    metadataCbortoJSON('')
    getProposal()
  }, [])

  return (
    <>
      <Sheet
        sx={{
          mt: 20,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '90vh',
          borderRadius: 'md',
          overflow: 'hidden',
          boxShadow: 'sm',
          backgroundColor: mode === 'dark' ? 'background.surface' : 'background.body',
          [`@media (max-width: 960px)`]: {
            height: 'calc(100vh - 64px)'
          }
        }}
      >
        {/* Proposal */}
        <Sheet
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: mode === 'dark' ? 'background.surface' : 'background.body'
          }}
        >
          <List>
            <GovernanceProposals proposals={proposals} mode={mode} />
          </List>
        </Sheet>
      </Sheet>
    </>
  )
}

import { Divider, Card } from '@mui/joy'

interface Proposal {
  proposal: any
  metadata: any
}

const GovernanceProposals: React.FC<{ proposals: Proposal[]; mode: string | undefined }> = ({
  proposals,
  mode
}) => {
  // ... (keep state and functions the same)

  return (
    <Sheet
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        borderRadius: 'md',
        overflow: 'hidden',
        boxShadow: 'none',
        backgroundColor: mode === 'dark' ? 'background.surface' : 'background.body'
      }}
    >
      <Sheet sx={{ bgcolor: mode ? 'background.surface' : 'background.level1' }}>
        <Typography level="body-md">Onchain Governance Proposals</Typography>
        <hr />
      </Sheet>

      <Sheet sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {proposals.map((proposal, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ padding: '0', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Card variant="outlined" sx={{ width: '100%', mb: 2, p: 2, borderRadius: 'lg' }}>
                  {/* ... (keep all content the same) */}
                </Card>
              </ListItem>
              {index < proposals.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Sheet>
    </Sheet>
  )
}
