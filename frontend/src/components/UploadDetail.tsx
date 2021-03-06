import React from 'react'
import { Link, useParams } from 'react-router-dom'
import useSwr from 'swr'

import supabase from '../api/supabaseClient'
import { Body, Button } from './Components'
import { snakeCaseToText } from '../util/snakeCaseToText'
import { definitions } from '../schema/rest-api'

export default function UploadDetail () {
  const tableName = 'uploaded_files'
  const { id } = useParams()
  const { data, error } = useSwr<definitions['uploaded_files']>(
    `${tableName}?id=${id}`,
    async () => {
      const result = await supabase.from(tableName).select().eq('id', id)
      if (result.error) throw result.error
      // todo check length
      if (result.data.length !== 1) throw Error('Wrong number of results')
      return result.data[0]
    }
  )

  if (error) return <span>error</span>
  if (!data) return <span>loading</span>

  return (
    <Body>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-row items-center space-x-6 pl-3">
          <Link to="./..">
            <Button>{snakeCaseToText(tableName)}</Button>
          </Link>
          <span className="text-2xl pl-1">&#8725;</span>
          <span className="text-2xl">{data.name ?? ''}</span>
        </div>
        <Link to="./prepare-base">
          <Button>Prepare Base</Button>
        </Link>
      </div>
    </Body>
  )
}
